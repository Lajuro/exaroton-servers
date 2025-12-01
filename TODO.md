<!-- Pra você IA | Sempre atualize esse documento, deixando a data de quando foi feito a correção -->
## Bugs, erros, coisas pra arrumar em geral
- [ ]  Reparei que ao trocar o idioma da página, é chamado a API de histórico novamente. Fiz esse teste estando na página de administrador, toda vez que eu troco o idioma, é feito 2 requisições:
    - GET /api/history?page=1&limit=10 200 in 74ms (compile: 1586µs, render: 73ms)
    - GET /api/account 200 in 625ms

    Percebi que isso acontece em todas as páginas, não existe uma forma de evitar a chamada de APIs sendo que estou só atualizando o idioma da página? Assim usa os dados que já tinha sido carregados e atualiza só o idioma do texto realmente, sem fazer mais nada.
    > 📅 Criação: Data: 30/11/2025 | Hora: 22:55
    > 📅 Atualização: Data: 00/00/0000 | Hora: 00:00

## Melhorias
- [ ] Fazer o projeto ficar mais preparado como um repositório open source, com o repositório bem trabalhado com um excelente README, CONTRIBUTING, Actions se necessário, tudo realmente que deixe o repositório bem profissional e bem pensado. Inclusive me ajude com um passo a passo de como gerenciar esse repositório mexendo lá pelo GitHub.