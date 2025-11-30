# Sistema de Gerenciamento de Créditos

Este documento descreve o sistema de monitoramento e gerenciamento de créditos do Exaroton implementado no MineServerManager.

## Visão Geral

O sistema permite:
- **Monitoramento em tempo real** dos créditos
- **Histórico de gastos** (dia, 3 dias, semana, mês)
- **Snapshots automáticos** para tracking preciso
- **Geração de relatórios em PDF**
- **Visualização do "dinheiro indo embora"** em tempo real

## Como Funciona o Preço do Exaroton

De acordo com a [documentação oficial](https://support.exaroton.com/hc/en-us/articles/360019687657-Pricing):

- **1 crédito = €0,01**
- **Custo**: 1 crédito por GB de RAM por hora
- **Exemplo**: 4GB RAM por 1 hora = 4 créditos
- **Taxa de storage**: 10 créditos/mês (descontado do uso do servidor)

### Cálculo de Taxa por Segundo

Para o modo tempo real:
- 1 crédito/GB/hora = 0.000277... créditos/GB/segundo
- Com 4GB: ~0.00111 créditos/segundo

## Componentes

### 1. HoverCard de Créditos (`CreditsHoverCard`)

Localizado na navbar, exibe:
- Saldo atual de créditos
- Resumo de gastos (hoje, 3 dias, semana)
- Médias por dia/hora
- Botão para ativar modo tempo real
- Ações para salvar snapshot e gerar relatório

**Modo Tempo Real**: Quando ativado, simula os créditos diminuindo baseado na taxa média de gasto. O indicador muda de verde para vermelho.

### 2. Dialog de Relatório (`CreditReportDialog`)

Permite:
- Selecionar período do relatório
- Visualizar prévia dos dados
- Gerar e baixar PDF com detalhamento completo

## APIs

### GET /api/credits/snapshot
Retorna o snapshot mais recente.

### POST /api/credits/snapshot
Cria um snapshot manual.
```json
{
  "type": "manual" // opcional, default: "manual"
}
```

### GET /api/credits/history
Retorna histórico completo com cálculos de gastos.

Resposta:
```json
{
  "currentCredits": 150.50,
  "spending": {
    "day": { "spent": 5.2, "averagePerHour": 0.21 },
    "threeDays": { "spent": 15.6, "averagePerDay": 5.2 },
    "week": { "spent": 36.4, "averagePerDay": 5.2 },
    "month": { "spent": 156.0, "averagePerDay": 5.2 }
  },
  "dailyBreakdown": [...],
  "lastSnapshot": {...}
}
```

### GET /api/credits/report
Retorna dados estruturados para geração de relatório.

Query params:
- `startDate`: Data inicial (ISO)
- `endDate`: Data final (ISO)

### POST /api/credits/auto-snapshot
Cria snapshot automático (para CRON jobs).

Headers necessários:
- `X-API-Key`: Chave secreta definida em `CRON_SECRET_KEY`

## Configuração de Snapshots Automáticos

### Usando Vercel Cron Jobs

Adicione ao `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/credits/auto-snapshot",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Usando serviço externo (cron-job.org, etc)

Configure uma chamada POST para:
```
POST https://seu-dominio.com/api/credits/auto-snapshot
Headers:
  X-API-Key: sua-chave-secreta
```

### Variáveis de Ambiente

Adicione ao `.env.local`:
```
CRON_SECRET_KEY=sua-chave-secreta-aqui
```

## Estrutura do Firebase

### Collection: `creditSnapshots`

```typescript
{
  id: string;
  credits: number;
  timestamp: Timestamp;
  type: 'start_of_day' | 'end_of_day' | 'hourly' | 'manual';
  serverStates: [{
    serverId: string;
    serverName: string;
    ram: number;
    status: number;
  }];
  runningServersCount?: number;
  totalRamInUse?: number;
}
```

## Regras do Firestore

Adicione estas regras para a collection `creditSnapshots`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... outras regras ...
    
    match /creditSnapshots/{snapshotId} {
      // Apenas admins podem ler/escrever
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Uso

### Visualizando Créditos

1. Faça login como admin
2. Passe o mouse sobre o indicador de créditos na navbar
3. Veja o resumo de gastos no HoverCard

### Ativando Modo Tempo Real

1. Abra o HoverCard de créditos
2. Clique em "Ativar" no modo tempo real
3. O indicador ficará vermelho e mostrará os créditos diminuindo

### Gerando Relatório PDF

1. Abra o HoverCard de créditos
2. Clique em "Relatório"
3. Selecione o período desejado
4. Clique em "Carregar Dados"
5. Revise a prévia
6. Clique em "Baixar PDF"

### Criando Snapshot Manual

1. Abra o HoverCard de créditos
2. Clique em "Salvar Snapshot"
3. O snapshot será salvo com o saldo atual

## Dicas

- **Snapshots frequentes** = dados mais precisos
- Configure o CRON para rodar **a cada hora** para melhor tracking
- Use o **modo tempo real** para sentir a urgência dos gastos 💸
- Gere relatórios **semanalmente** para acompanhar tendências
