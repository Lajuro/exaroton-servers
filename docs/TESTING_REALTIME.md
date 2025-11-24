# Guia de Teste: Atualização em Tempo Real

## Como Testar

### 1. Iniciar o Servidor
```bash
npm run dev
```

### 2. Abrir o Dashboard
1. Faça login com sua conta Google
2. Navegue para `/dashboard`
3. Observe os cards dos servidores

### 3. Verificar Conexão em Tempo Real

Você verá um **badge verde "Ao vivo"** no canto superior direito de cada card quando a conexão estiver ativa:

```
┌─────────────────────────────────┐
│                    🟢 Ao vivo   │
│  My Server                      │
│  example.exaroton.me            │
│  🟢 Online                      │
│  Jogadores: 3/20                │
│  [Iniciar] [Parar] [Reiniciar] │
└─────────────────────────────────┘
```

### 4. Testar Atualização Automática

**Cenário 1: Iniciar Servidor**
1. Clique em "Iniciar" em um servidor offline
2. Observe o status mudar automaticamente:
   - Offline → Preparando → Iniciando → Online
3. Contagem de jogadores aparece quando o servidor fica online

**Cenário 2: Jogadores Entrando/Saindo**
1. Entre no servidor Minecraft
2. No dashboard, a contagem de jogadores atualiza automaticamente
3. Saia do servidor
4. Contagem diminui automaticamente

**Cenário 3: Parar Servidor**
1. Clique em "Parar"
2. Status muda automaticamente:
   - Online → Parando → Offline

**Cenário 4: Múltiplos Servidores**
1. Abra vários cards
2. Cada um conecta independentemente
3. Todos mostram badge "Ao vivo"
4. Atualizações simultâneas funcionam

### 5. Verificar Reconexão

**Simular desconexão:**
1. Abra DevTools (F12)
2. Vá para Network tab
3. Ative "Offline"
4. Badge "Ao vivo" desaparece
5. Desative "Offline"
6. Após ~5 segundos, badge "Ao vivo" retorna

### 6. Verificar Console do Servidor

No terminal onde `npm run dev` está rodando, você verá logs:
```
[firebase-admin] Initialized...
GET /api/servers 200 in 523ms
GET /dashboard 200 in 1234ms
SSE connection opened for server: abc123def456
Status update sent: {"status":1,"name":"My Server",...}
```

### 7. Verificar Cleanup

1. Feche a aba do dashboard
2. No console do servidor, você verá:
   ```
   SSE connection closed
   Unsubscribed from WebSocket
   ```

## Comportamento Esperado

✅ **Conexão instantânea** ao abrir dashboard
✅ **Badge "Ao vivo"** aparece em ~1-2 segundos
✅ **Status atualiza** sem refresh manual
✅ **Jogadores contam** em tempo real
✅ **Reconexão automática** em caso de falha
✅ **Sem lag** ou travamentos
✅ **Múltiplas conexões** funcionam simultaneamente

## Troubleshooting

### Badge não aparece
- ✅ Verifique que o dev server está rodando
- ✅ Abra DevTools → Console para ver erros
- ✅ Verifique que o token Firebase está válido
- ✅ Confirme que a API key do Exaroton está correta

### Atualização não acontece
- ✅ Verifique logs do servidor
- ✅ Confirme que WebSocket conectou no Exaroton
- ✅ Teste com outro servidor

### Erro 401 (Unauthorized)
- ✅ Faça logout e login novamente
- ✅ Token pode ter expirado

### Performance Issues
- ✅ Cada card abre uma conexão SSE
- ✅ Para muitos servidores (>10), considere virtualização
- ✅ Conexões são leves, mas Chrome limita ~6 SSE por domínio

## DevTools: Monitorar Conexões

### Network Tab
1. Filtrar por "stream"
2. Você verá requests persistentes com status "Pending"
3. Clique para ver eventos SSE em tempo real

### Console
```javascript
// Ver todas as conexões EventSource ativas
// (Execute no console do navegador)
console.log(performance.getEntriesByType('resource')
  .filter(r => r.name.includes('stream')));
```
