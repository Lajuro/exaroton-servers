# Sistema de Histórico de Ações

O MineServerManager mantém um registro completo de todas as ações administrativas realizadas no sistema.

## Tipos de Ações

| Tipo | Descrição | Contexto |
|------|-----------|----------|
| `server_start` | Servidor iniciado | serverId, serverName |
| `server_stop` | Servidor parado | serverId, serverName |
| `server_restart` | Servidor reiniciado | serverId, serverName |
| `server_command` | Comando executado | serverId, serverName, command |
| `user_access_grant` | Acesso concedido | targetUserId, serverId |
| `user_access_revoke` | Acesso revogado | targetUserId, serverId |
| `user_role_change` | Função alterada | targetUserId, previousRole, newRole |
| `content_update` | Conteúdo atualizado | serverId, fieldUpdated |
| `document_upload` | Documento enviado | serverId, documentName |
| `document_delete` | Documento excluído | serverId, documentName |
| `login` | Usuário fez login | ipAddress, userAgent |
| `logout` | Usuário fez logout | - |

## API

### GET /api/history

Busca histórico de ações com filtros opcionais.

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| userId | string | Filtrar por usuário |
| serverId | string | Filtrar por servidor |
| type | string | Tipo de ação (múltiplos separados por vírgula) |
| startDate | ISO string | Data inicial |
| endDate | ISO string | Data final |
| success | boolean | Filtrar por sucesso/falha |
| limit | number | Limite de resultados (max: 200) |
| page | number | Página atual |

**Resposta:**

```json
{
  "logs": [
    {
      "id": "abc123",
      "type": "server_start",
      "userId": "user123",
      "userName": "João Silva",
      "userEmail": "joao@email.com",
      "timestamp": "2024-01-15T10:30:00Z",
      "serverId": "srv001",
      "serverName": "Survival",
      "success": true
    }
  ],
  "total": 150,
  "hasMore": true,
  "page": 1,
  "pageSize": 50
}
```

### POST /api/history

Registra nova ação no histórico.

**Body:**

```json
{
  "type": "server_start",
  "serverId": "srv001",
  "serverName": "Survival",
  "details": {
    "previousStatus": 0,
    "newStatus": 2
  },
  "success": true
}
```

## Helper para Logging

Use o helper `logAction` para registrar ações facilmente:

```typescript
import { logAction } from '@/lib/action-logger';

// Em uma API route
await logAction({
  type: 'server_start',
  userId: decodedToken.uid,
  userName: decodedToken.name,
  userEmail: decodedToken.email,
  serverId: 'srv001',
  serverName: 'Survival',
  success: true,
});
```

## Componente ActionHistory

O componente `ActionHistory` exibe o histórico com filtros e paginação:

```tsx
import { ActionHistory } from '@/components/ActionHistory';

// Modo completo
<ActionHistory />

// Filtrar por servidor
<ActionHistory serverId="srv001" />

// Modo compacto (para sidebars)
<ActionHistory compact limit={5} />
```

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| serverId | string | Filtrar por servidor específico |
| userId | string | Filtrar por usuário específico |
| compact | boolean | Modo compacto para embedding |
| limit | number | Limite de itens por página |

## Coleção Firestore

### actionLogs

```typescript
{
  id: string;              // Auto-generated
  type: ActionType;        // Tipo da ação
  userId: string;          // UID do usuário que executou
  userName: string;        // Nome do usuário
  userEmail: string;       // Email do usuário
  userPhotoUrl?: string;   // Foto do usuário
  timestamp: Timestamp;    // Data/hora (server timestamp)
  
  // Contexto opcional
  serverId?: string;
  serverName?: string;
  targetUserId?: string;
  targetUserName?: string;
  
  // Detalhes específicos
  details?: {
    command?: string;
    previousRole?: string;
    newRole?: string;
    documentName?: string;
    fieldUpdated?: string;
    previousValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  
  success: boolean;
  errorMessage?: string;
}
```

### Índices Recomendados

```
actionLogs:
  - timestamp DESC (ordenação principal)
  - userId, timestamp DESC (filtro por usuário)
  - serverId, timestamp DESC (filtro por servidor)
  - type, timestamp DESC (filtro por tipo)
```

## Integrando com Ações Existentes

Para adicionar logging a ações existentes, importe e use o helper:

```typescript
// Em app/api/servers/[id]/start/route.ts
import { logAction } from '@/lib/action-logger';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // ... código existente ...
  
  try {
    // Executar ação
    await startServer(params.id);
    
    // Registrar sucesso
    await logAction({
      type: 'server_start',
      userId: user.uid,
      userName: user.name,
      userEmail: user.email,
      serverId: params.id,
      serverName: server.name,
      success: true,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Registrar falha
    await logAction({
      type: 'server_start',
      userId: user.uid,
      userName: user.name,
      userEmail: user.email,
      serverId: params.id,
      serverName: server.name,
      success: false,
      errorMessage: error.message,
    });
    
    throw error;
  }
}
```

## Boas Práticas

1. **Sempre registre** ações administrativas importantes
2. **Inclua contexto** suficiente para entender a ação
3. **Registre falhas** para debugging
4. **Não registre dados sensíveis** em detalhes
5. **Use server timestamp** para consistência
6. **Limite a retenção** de logs antigos (considere cleanup periódico)
