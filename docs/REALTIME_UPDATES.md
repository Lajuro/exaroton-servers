# Sistema de Atualização em Tempo Real

## Visão Geral

O sistema implementa atualização em tempo real do status dos servidores usando:
- **Server-Sent Events (SSE)** no cliente
- **WebSocket do Exaroton** no servidor
- **Reconexão automática** em caso de falhas

## Arquitetura

### Backend: `/api/servers/[id]/stream`

**Fluxo:**
1. Cliente conecta via EventSource com token Firebase
2. Servidor verifica autenticação
3. Cria conexão WebSocket com Exaroton (`server.subscribe()`)
4. Envia status inicial via SSE
5. Propaga atualizações do WebSocket para o cliente via SSE
6. Mantém conexão viva com heartbeat (30s)
7. Limpa recursos ao desconectar

**Eventos enviados:**
```json
{
  "status": 1,
  "name": "My Server",
  "address": "example.exaroton.me",
  "players": {
    "count": 3,
    "max": 20
  }
}
```

### Frontend: `ServerCard.tsx`

**Recursos:**
- ✅ Conexão SSE automática ao montar
- ✅ Atualização em tempo real (status, jogadores)
- ✅ Badge "Ao vivo" quando conectado
- ✅ Reconexão automática após 5s em caso de erro
- ✅ Cleanup ao desmontar componente
- ✅ Não requer refresh manual

**Estado local:**
- `server`: Estado atual (sincronizado via SSE)
- `isLive`: Indica se está conectado ao stream
- `eventSourceRef`: Referência à conexão SSE

## Uso

O usuário não precisa fazer nada. Ao abrir o dashboard:
1. Cada card conecta automaticamente
2. Status/players atualizam em tempo real
3. Badge "Ao vivo" mostra conexão ativa
4. Ao clicar em Iniciar/Parar/Reiniciar, a mudança aparece automaticamente

## Benefícios

- **Sem polling**: Economiza requests e recursos
- **Latência baixa**: Atualizações instantâneas via WebSocket
- **Confiável**: Reconexão automática
- **UX aprimorada**: Feedback visual imediato
- **Escalável**: SSE é leve e suporta múltiplas conexões

## Tratamento de Erros

- **Falha de autenticação**: Retorna 401, cliente não conecta
- **Erro no WebSocket**: Servidor loga, tenta manter SSE ativo
- **Desconexão SSE**: Cliente reconecta após 5s
- **Cleanup**: Recursos limpos ao desmontar ou abortar request

## Performance

- **Heartbeat**: Mantém conexão sem overhead (apenas comentário SSE)
- **Múltiplos cards**: Cada um gerencia sua própria conexão
- **Memory**: Conexões limpas ao desmontar, sem vazamentos
