# Política de Segurança

## Versões Suportadas

| Versão | Suportada          |
| ------ | ------------------ |
| 0.1.x  | :white_check_mark: |

## Reportando uma Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança, por favor **NÃO** abra uma issue pública.

Em vez disso, envie um email para o mantenedor do projeto descrevendo:
- Tipo de vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestões de correção (se houver)

Você pode esperar:
- Confirmação de recebimento em até 48 horas
- Avaliação inicial em até 1 semana
- Atualizações regulares sobre o progresso da correção

## Boas Práticas de Segurança

### Variáveis de Ambiente

- **NUNCA** commite o arquivo `.env` no repositório
- Use `.env.example` como template
- Mantenha suas chaves de API seguras
- Rotacione credenciais regularmente

### Firebase

- Configure regras de segurança apropriadas no Firestore
- Use autenticação para todas as operações sensíveis
- Mantenha o Firebase Admin SDK separado do cliente

### Exaroton API

- Proteja sua API key do Exaroton
- Use a key apenas no servidor (não exponha no cliente)
- Monitore o uso da API

### Produção

- Use HTTPS em produção
- Configure cabeçalhos de segurança apropriados
- Implemente rate limiting nas APIs
- Monitore logs de acesso e erros
- Mantenha dependências atualizadas

## Dependências

Execute regularmente:
```bash
npm audit
npm update
```

Para verificar e corrigir vulnerabilidades conhecidas.
