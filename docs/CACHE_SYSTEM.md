# Sistema de Cache do Exaroton

Este documento explica como funciona o sistema de cache implementado para reduzir chamadas à API do Exaroton.

## Visão Geral

O sistema implementa um cache de 5 minutos em Firestore para dados dos servidores Exaroton, reduzindo latência e evitando rate limits da API.

## Arquitetura

### 1. Coleção `serverCache`

Estrutura dos documentos:

```typescript
{
  serverId: string;           // ID do servidor (document ID)
  data: ExarotonServer;       // Dados completos do servidor
  cachedAt: Timestamp;        // Quando foi cacheado
  expiresAt: Timestamp;       // Quando expira (cachedAt + 5 min)
  lastFetched: Timestamp;     // Última vez que foi buscado
}
```

### 2. Funções Helper

Em `lib/firebase-admin.ts`:

#### `getCachedServer(serverId: string)`
- Busca servidor do cache
- Retorna `null` se não existir ou expirou
- TTL: 5 minutos

#### `setCachedServer(serverId: string, data: ExarotonServer)`
- Armazena servidor no cache
- Define expiração para now + 5 minutos
- Não lança erro se falhar (cache é opcional)

#### `invalidateServerCache(serverId: string)`
- Remove servidor do cache
- Chamado após ações: start, stop, restart
- Garante dados frescos após mudanças

#### `invalidateAllServerCaches()`
- Limpa todo o cache
- Útil para manutenção
- Usa batch write para eficiência

## Fluxo de Uso

### 1. Listar Servidores (`/api/servers`)

```
Requisição
  ↓
Verificar query param forceRefresh
  ↓
Se forceRefresh=false:
  ├→ Buscar do cache (getCachedServer)
  ├→ Se válido: retornar cached data
  └→ Se expirado/não existe:
      ├→ Buscar da API Exaroton
      └→ Salvar no cache (setCachedServer)
Se forceRefresh=true:
  ├→ Buscar direto da API
  └→ Atualizar cache
```

### 2. Detalhes do Servidor (`/api/servers/[id]`)

```
Requisição
  ↓
Verificar auth e acesso
  ↓
Verificar query param forceRefresh
  ↓
Se forceRefresh=false:
  ├→ Buscar do cache
  └→ Se não existe: buscar da API e cachear
Se forceRefresh=true:
  └→ Buscar direto da API e atualizar cache
  ↓
Retornar { server, fromCache: boolean }
```

### 3. Ações (Start/Stop/Restart)

```
Ação solicitada
  ↓
Executar na API Exaroton
  ↓
Invalidar cache (invalidateServerCache)
  ↓
Frontend aguarda 2s
  ↓
Frontend chama API com forceRefresh=true
  ↓
Retorna dados atualizados
```

## Indicadores Visuais

### No Frontend

A página de detalhes mostra badges indicando origem dos dados:

```tsx
<Badge variant="outline">
  {isLive ? (
    <>
      <Wifi className="h-3 w-3 mr-1" />
      Live
    </>
  ) : (
    <>
      <WifiOff className="h-3 w-3 mr-1" />
      Cache {fromCache && '(5min)'}
    </>
  )}
</Badge>
```

- **Live**: Conectado via SSE (dados em tempo real)
- **Cache (5min)**: Usando dados cacheados

### Botão de Refresh

```tsx
<Button onClick={() => fetchServerData(true)}>
  <RefreshCw />
</Button>
```

Força busca da API ignorando cache.

## Benefícios

### 1. Performance
- **Latência reduzida**: ~50ms (Firestore) vs ~500ms (Exaroton API)
- **Menos tempo de carregamento**: Dashboard carrega instantaneamente

### 2. Confiabilidade
- **Tolerância a falhas**: Se API Exaroton cair, mostra dados cacheados
- **Rate limit protection**: Evita atingir limites da API

### 3. Custo
- **Menos chamadas externas**: Reduz custos da API Exaroton (se houver)
- **Custo Firestore**: Mínimo (leituras são baratas)

## Monitoramento

### Verificar Cache no Firestore Console

1. Acesse Firestore Database
2. Navegue para coleção `serverCache`
3. Verifique documentos:
   - `serverId`: ID do servidor
   - `expiresAt`: Quando expira
   - `data`: Dados cacheados

### Logs

As funções de cache logam erros mas não lançam exceções:

```typescript
console.error('[getCachedServer] Error:', error);
console.error('[setCachedServer] Error:', error);
console.error('[invalidateServerCache] Error:', error);
```

## Manutenção

### Limpeza Manual

Para limpar todo o cache:

```typescript
// No console do Node.js ou Cloud Functions
import { invalidateAllServerCaches } from '@/lib/firebase-admin';
await invalidateAllServerCaches();
```

### Limpeza Automática (Opcional)

Você pode configurar um Cloud Function para limpar caches expirados:

```typescript
// functions/src/cleanExpiredCache.ts
import * as functions from 'firebase-functions';
import { adminDb } from './firebase-admin';

export const cleanExpiredCache = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const now = new Date();
    const snapshot = await adminDb()
      .collection('serverCache')
      .where('expiresAt', '<', now)
      .get();
    
    const batch = adminDb().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`Deleted ${snapshot.size} expired cache entries`);
  });
```

## Ajuste de TTL

Para mudar o TTL de 5 minutos para outro valor:

Em `lib/firebase-admin.ts`:

```typescript
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
// ou
const CACHE_TTL_MS = 2 * 60 * 1000;  // 2 minutos
```

**Recomendações:**
- **2-5 min**: Para dados que mudam frequentemente (status, players)
- **10-15 min**: Para dados estáticos (nome, software)
- **Cache seletivo**: Diferentes TTLs para diferentes tipos de dados

## Cache Seletivo (Implementação Futura)

Você pode implementar cache com TTL variável:

```typescript
interface CacheConfig {
  dynamic: number;  // 2 min para status, players
  static: number;   // 15 min para nome, software
}

async function getCachedServerSmart(serverId: string, field: 'dynamic' | 'static') {
  // Implementar lógica de cache seletivo
}
```

## Troubleshooting

### Cache não está funcionando

1. **Verificar Firestore Rules**: Certifique-se que `serverCache` collection é acessível
2. **Verificar logs**: Procure erros de `[getCachedServer]` ou `[setCachedServer]`
3. **Verificar timestamps**: Confirme que `expiresAt` está no futuro

### Dados desatualizados

1. **Forçar refresh**: Use `?forceRefresh=true` na URL
2. **Invalidar cache**: Após ações importantes
3. **Reduzir TTL**: Se dados mudam muito rápido

### Cache expira muito rápido

1. **Aumentar TTL**: De 5 para 10+ minutos
2. **Implementar cache em memória**: Adicionar camada extra de cache
3. **Pre-warming**: Atualizar cache antes de expirar

## Custos Estimados

### Firestore (Plano Blaze)

Para 10 servidores com 100 usuários ativos:

**Sem cache:**
- 100 usuários × 10 servers × 10 refreshes/dia = 10,000 reads da API
- Custo Exaroton API: potencialmente alto

**Com cache (5 min TTL):**
- Cache hits: ~80% das requisições
- 2,000 leituras da API + 10,000 leituras Firestore
- Custo Firestore: $0.06 per 100k reads = **~$0.006/dia**
- Custo API: 80% menor

**Economia estimada: 80% nas chamadas de API**

## Próximos Passos

Para melhorar o sistema de cache:

1. ✅ Implementar métricas de cache hit/miss
2. ✅ Adicionar cache em memória (Redis/Upstash)
3. ✅ Implementar pre-warming (atualizar antes de expirar)
4. ✅ Cache seletivo por tipo de dado
5. ✅ Dashboard de monitoramento de cache

---

**Última atualização:** 25/11/2025
