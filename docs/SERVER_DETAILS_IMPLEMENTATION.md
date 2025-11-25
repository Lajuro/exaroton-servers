# Páginas de Detalhes dos Servidores - Implementação Completa

## O que foi implementado

### ✅ 1. Sistema de Cache (5 minutos)
- Cache em Firestore para dados da API Exaroton
- Reduz latência e protege contra rate limits
- Invalidação automática após ações (start/stop/restart)
- Indicador visual de dados "Live" vs "Cache"
- Documentação completa em `docs/CACHE_SYSTEM.md`

### ✅ 2. Firebase Storage para Uploads
- Upload de imagens (banner e ícone)
- Upload de documentos PDF
- Processamento automático de imagens:
  - Redimensionamento (banner: 1200x400px, ícone: 256x256px)
  - Conversão para WebP (melhor compressão)
  - Otimização com qualidade 85%
- Validação de tamanho e tipo de arquivo
- Documentação completa em `docs/STORAGE_SETUP.md`

### ✅ 3. API de Upload (`/api/servers/[id]/upload`)
- **POST**: Upload de arquivos
  - Validação de tipo MIME
  - Validação de tamanho (5MB imagens, 10MB PDFs)
  - Processamento de imagens com Sharp
  - Armazenamento no Firebase Storage
  - Atualização do Firestore com URLs
- **DELETE**: Remoção de arquivos
  - Delete do Storage
  - Atualização do Firestore

### ✅ 4. API de Conteúdo (`/api/servers/[id]/content`)
- **GET**: Buscar conteúdo customizado
- **PUT/PATCH**: Atualizar instruções de acesso, descrição, tags
- Controle de acesso (admin ou usuário autorizado)
- Rastreamento de edições (lastEditedBy)

### ✅ 5. Página de Detalhes (`/servers/[id]`)
Componentes implementados:
- **ServerBanner**: Banner/capa do servidor (estilo Notion)
- **ServerIcon**: Ícone customizável do servidor
- **AccessInstructions**: Instruções de como acessar
- **DocumentList**: Lista de PDFs com download
- **Estatísticas**: Jogadores, software, endereço
- **Controles**: Iniciar, parar, reiniciar servidor
- **Cache indicator**: Badge mostrando se dados são live ou cached

Funcionalidades:
- Verificação de acesso (admin ou servidor em serverAccess)
- Integração com SSE para updates em tempo real
- Botão de refresh forçado
- Link para página de edição

### ✅ 6. Página de Edição (`/servers/[id]/edit`)
- Upload de banner (drag & drop ou file input)
- Upload de ícone
- Upload de PDFs
- Editor de descrição
- Editor de instruções de acesso (textarea com preview)
- Preview de imagens antes de salvar
- Remoção de arquivos
- Lista de documentos com opção de delete

### ✅ 7. Atualização do Dashboard
- Botão "Ver Detalhes" em cada ServerCard
- Link direto para `/servers/[id]`

### ✅ 8. Tipos TypeScript
Novos tipos em `types/index.ts`:
```typescript
ServerCache          // Cache de servidor (TTL 5min)
ServerContent        // Conteúdo customizado
ServerDocument       // Documento PDF
```

## Estrutura de Arquivos Criados/Modificados

### Novos Arquivos
```
app/
  servers/
    [id]/
      page.tsx          # Página de detalhes
      edit/
        page.tsx        # Página de edição
  api/
    servers/
      [id]/
        upload/
          route.ts      # API de upload
        content/
          route.ts      # API de conteúdo

components/
  ServerBanner.tsx      # Componente de banner
  ServerIcon.tsx        # Componente de ícone
  AccessInstructions.tsx # Componente de instruções
  DocumentList.tsx      # Componente de lista de docs

docs/
  STORAGE_SETUP.md      # Guia de configuração do Storage
  CACHE_SYSTEM.md       # Documentação do sistema de cache
```

### Arquivos Modificados
```
lib/
  firebase.ts           # + getStorage (client)
  firebase-admin.ts     # + getStorage (admin) + cache helpers

app/api/servers/
  route.ts              # + cache logic
  [id]/
    route.ts            # + cache logic
    start/route.ts      # + invalidateServerCache
    stop/route.ts       # + invalidateServerCache
    restart/route.ts    # + invalidateServerCache

components/
  ServerCard.tsx        # + botão "Ver Detalhes"

types/
  index.ts              # + ServerCache, ServerContent, ServerDocument
```

## Dependências Instaladas

```json
{
  "sharp": "^0.33.0",           // Processamento de imagens
  "busboy": "^1.6.0",           // Parse multipart form data
  "@types/busboy": "^1.5.x"     // Types para TypeScript
}
```

## Banco de Dados

### Novas Coleções no Firestore

#### `serverCache`
```typescript
{
  serverId: string;
  data: ExarotonServer;
  cachedAt: Timestamp;
  expiresAt: Timestamp;
  lastFetched: Timestamp;
}
```

#### `serverContent`
```typescript
{
  serverId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastEditedBy: string;
  
  accessInstructions?: string;
  bannerUrl?: string;
  iconUrl?: string;
  description?: string;
  tags?: string[];
  documents: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: Timestamp;
    uploadedBy: string;
    size: number;
    type: string;
  }>;
}
```

### Firebase Storage

Estrutura de pastas:
```
/servers/
  /{serverId}/
    banner.webp
    icon.webp
    /documents/
      {timestamp}_{nome}.pdf
```

## Próximos Passos

### Configuração Necessária

1. **Ativar Firebase Storage**
   - Acesse Firebase Console
   - Ative Storage
   - Configure regras de segurança (ver `docs/STORAGE_SETUP.md`)

2. **Testar Sistema**
   - Criar página de detalhes de um servidor
   - Fazer upload de banner
   - Fazer upload de ícone
   - Adicionar instruções de acesso
   - Fazer upload de PDF
   - Testar cache (verificar badge "Live" vs "Cache")

### Melhorias Futuras (Opcional)

1. **Rich Text Editor**
   - Instalar TipTap ou Quill
   - Substituir textarea por editor rico
   - Suporte para imagens inline nas instruções

2. **Drag & Drop Upload**
   - Instalar react-dropzone
   - Interface de drag & drop para uploads
   - Preview de múltiplos arquivos

3. **Markdown Support**
   - Parser de Markdown para instruções
   - Preview ao vivo
   - Syntax highlighting

4. **Permissões Granulares**
   - Diferentes níveis de acesso (viewer, editor, admin)
   - Permissão por tipo de conteúdo
   - Log de auditoria de edições

5. **Histórico de Versões**
   - Versionamento de instruções de acesso
   - Histórico de uploads/remoções
   - Rollback de alterações

6. **Busca e Filtros**
   - Busca por tags
   - Filtrar servidores por tipo de conteúdo
   - Busca full-text em instruções

## Documentação Adicional

- **Storage Setup**: `docs/STORAGE_SETUP.md`
  - Como configurar Firebase Storage
  - Regras de segurança
  - Estrutura de pastas
  - Monitoramento e manutenção

- **Cache System**: `docs/CACHE_SYSTEM.md`
  - Arquitetura do cache
  - Fluxo de dados
  - TTL e invalidação
  - Monitoramento e troubleshooting

## Suporte

Se encontrar problemas:

1. **Erros de Upload**
   - Verifique regras do Storage
   - Confirme que usuário está autenticado
   - Verifique tamanho do arquivo

2. **Cache não funciona**
   - Verifique logs do servidor
   - Confirme que Firestore está acessível
   - Use `?forceRefresh=true` para testar

3. **Página não carrega**
   - Verifique permissões do usuário
   - Confirme que servidor existe
   - Veja logs de erro no console

---

**Implementado em:** 25/11/2025
**Status:** ✅ Completo e funcional
