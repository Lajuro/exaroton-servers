# TODO: Internacionalização (i18n) do Site

Este documento rastreia o progresso da implementação de internacionalização em todos os arquivos do projeto.

## Status Geral
- [ ] Todos os componentes traduzidos
- [ ] Todos os textos adicionados em `messages/en.json`
- [ ] Todos os textos adicionados em `messages/pt-BR.json`
- [ ] Testes de troca de idioma realizados

---

## Componentes

### 1. `components/AccessInstructions.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] "Como Acessar"
  - [ ] "Nenhuma instrução de acesso foi adicionada ainda."
- **Status:** ❌ Não iniciado

### 2. `components/ActionHistory.tsx`
- [ ] Implementar `useTranslations` corretamente (já importa mas não usa em tudo)
- [ ] Traduzir textos:
  - [ ] `actionTypeLabels` (Iniciar servidor, Parar servidor, etc.)
  - [ ] `formatTimestamp` (Agora, min atrás, h atrás, d atrás)
  - [ ] `getActionDescription` (iniciou o servidor, parou o servidor, etc.)
  - [ ] "Nenhuma ação registrada"
  - [ ] "Histórico de Ações"
  - [ ] "ações registradas"
  - [ ] "Registro de atividades do sistema"
  - [ ] "Filtrar por tipo"
  - [ ] "Todos os tipos"
  - [ ] Detalhes do modal de visualização
- **Status:** ❌ Não iniciado

### 3. `components/CreditReportDialog.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] "Não autenticado"
  - [ ] "Erro ao gerar relatório"
  - [ ] Títulos do PDF: "Relatório de Créditos Exaroton"
  - [ ] "Período:", "Gerado em:"
  - [ ] "Resumo Geral"
  - [ ] Labels: "Créditos Iniciais:", "Créditos Finais:", "Total Gasto:", etc.
  - [ ] "Detalhamento Diário"
  - [ ] Headers da tabela: "Data", "Início", "Fim", "Gasto"
  - [ ] "Uso por Servidor"
  - [ ] Headers: "Servidor", "RAM (GB)", "Horas", "Créditos Est."
  - [ ] Footer do PDF
- **Status:** ❌ Não iniciado

### 4. `components/CreditsHoverCard.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] "Erro ao buscar créditos"
  - [ ] "Créditos Exaroton"
  - [ ] "Monitoramento de gastos"
  - [ ] "Desafixar", "Fixar aberto"
  - [ ] "Saldo Atual"
  - [ ] "créditos"
  - [ ] "Modo Tempo Real"
  - [ ] "Parar", "Iniciar"
  - [ ] "Início", "Atual", "Gasto"
  - [ ] Títulos de período: "Hoje", "3 dias", "7 dias", "30 dias"
  - [ ] "Gerar Relatório"
  - [ ] "Sem dados"
- **Status:** ❌ Não iniciado

### 5. `components/ServerCard.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] `STATUS_CONFIG` labels (Offline, Online, Iniciando, Parando, etc.)
  - [ ] Toast messages: "Comando enviado", "Servidor... iniciando/parando"
  - [ ] "Erro"
  - [ ] "Copiado!", "Endereço copiado para a área de transferência."
  - [ ] "Não foi possível copiar o endereço"
  - [ ] "Comando executado"
  - [ ] Dialog de comando (títulos, labels, opções)
  - [ ] Dialog de confirmação de ações
- **Status:** ❌ Não iniciado

### 6. `components/ServerConsole.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] "Não autenticado"
  - [ ] "Conectado ao console do servidor"
  - [ ] "Servidor ficou offline"
  - [ ] "Conexão perdida. Clique em conectar para reconectar."
  - [ ] "Erro ao conectar"
  - [ ] "Desconectado do console"
  - [ ] "Console do Servidor"
  - [ ] "Acesso ao console disponível apenas para administradores"
  - [ ] Badges: "Conectado", "Desconectado"
  - [ ] Tooltips: "Continuar auto-scroll", "Pausar auto-scroll", etc.
  - [ ] Mensagem de servidor offline
  - [ ] "Conectar ao Console"
  - [ ] Placeholder do input
- **Status:** ❌ Não iniciado

### 7. `components/ServerControls.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] `STATUS_NAMES` (Offline, Online, Iniciando, etc.)
  - [ ] Botões: "Iniciar Servidor", "Parar Servidor", "Reiniciar"
  - [ ] "Parando..."
  - [ ] "Enviar Comando"
  - [ ] Dialog de comando:
    - [ ] Título e descrição
    - [ ] "Tipo de Comando"
    - [ ] Opções: "Comando Personalizado", "Enviar Mensagem", etc.
    - [ ] Labels e placeholders
    - [ ] "Não inclua a barra (/) no início do comando"
    - [ ] Opções de tempo: "Dia", "Meio-dia", "Noite", "Meia-noite"
    - [ ] Opções de clima: "Limpo", "Chuva", "Tempestade"
    - [ ] Opções de gamemode: "Survival", "Creative", etc.
  - [ ] "Cancelar", "Executar"
  - [ ] Card: "Controles", "Gerencie o estado do servidor"
- **Status:** ❌ Não iniciado

### 8. `components/GlobalLoading.tsx`
- [ ] Verificar e adicionar `useTranslations` se necessário
- [ ] Traduzir textos hardcoded
- **Status:** ❓ Precisa verificar

### 9. `components/layout/Navbar.tsx`
- [ ] Verificar uso de `useTranslations`
- [ ] Traduzir qualquer texto hardcoded
- **Status:** ❓ Precisa verificar

---

## Páginas

### 10. `app/not-found.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] Nomes de blocos (Pedra, Terra, Grama, etc.)
  - [ ] Nomes de materiais (Pedregulho, Madeira, etc.)
  - [ ] Nomes de picaretas (Picareta de Madeira, etc.)
  - [ ] Mensagens do jogo
  - [ ] Botões e UI
- **Status:** ❌ Não iniciado
- **Nota:** Esta página tem MUITOS textos por ser um mini-jogo

### 11. `app/login/page.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] "Verificando autenticação"
  - [ ] "Painel de Controle"
  - [ ] Hero text: "Gerencie seus servidores Minecraft com facilidade"
  - [ ] Descrição longa
  - [ ] Feature cards: títulos e descrições
  - [ ] Stats: "Uptime", "Updates", "Grátis", "Para usar"
  - [ ] Card de login: título, descrição, botão
  - [ ] Footer
- **Status:** ❌ Não iniciado

### 12. `app/dashboard/page.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] Mensagens de erro
  - [ ] "Dashboard"
  - [ ] "Gerencie seus servidores de Minecraft em tempo real"
  - [ ] "Atualizar"
  - [ ] "Buscar..."
  - [ ] "Ordenar"
  - [ ] Opções de ordenação: "Status", "Jogadores", "Nome"
  - [ ] Cards de stats: "Total", "Online", "Jogadores"
  - [ ] Estado vazio: mensagem de sem servidores
  - [ ] Estado de erro
- **Status:** ❌ Não iniciado

### 13. `app/admin/page.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] Mensagens de erro
  - [ ] "Administração"
  - [ ] "Gerencie usuários e permissões do sistema"
  - [ ] "Buscar usuário..."
  - [ ] Opções de ordenação
  - [ ] Toast messages
  - [ ] Cards de stats
  - [ ] Tabela de usuários (headers, badges)
  - [ ] Dialog de edição de usuário
  - [ ] Seção de histórico de ações
- **Status:** ❌ Não iniciado

### 14. `app/servers/[id]/page.tsx`
- [ ] Adicionar `useTranslations`
- [ ] Traduzir textos:
  - [ ] `statusConfig` labels
  - [ ] Toast messages
  - [ ] Títulos de seções
  - [ ] Badges e labels
  - [ ] Informações do servidor
- **Status:** ❌ Não iniciado

### 15. `app/servers/[id]/edit/page.tsx`
- [ ] Verificar e adicionar `useTranslations`
- [ ] Traduzir todos os textos da página de edição
- **Status:** ❓ Precisa verificar completamente

---

## Arquivos de Mensagens

### 16. `messages/en.json`
- [ ] Adicionar namespace `accessInstructions`
- [ ] Adicionar namespace `actionHistory`
- [ ] Adicionar namespace `creditReport`
- [ ] Expandir namespace `credits` com mais textos
- [ ] Expandir namespace `servers` com textos de controles e console
- [ ] Adicionar namespace `login`
- [ ] Expandir namespace `dashboard`
- [ ] Expandir namespace `admin`
- [ ] Adicionar namespace `serverDetails`
- [ ] Adicionar namespace `serverEdit`
- [ ] Adicionar namespace `notFound` (página 404)
- [ ] Adicionar namespace `commands` (comandos do servidor)
- **Status:** ❌ Não iniciado

### 17. `messages/pt-BR.json`
- [ ] Espelhar todas as adições do `en.json`
- **Status:** ❌ Não iniciado

---

## Verificação Final

### Testes a realizar após conclusão:
- [ ] Trocar idioma para Inglês e verificar TODAS as páginas
- [ ] Trocar idioma para Português e verificar TODAS as páginas
- [ ] Verificar que nenhum texto aparece em idioma errado
- [ ] Verificar toasts e notificações
- [ ] Verificar modais e dialogs
- [ ] Verificar mensagens de erro
- [ ] Verificar página 404
- [ ] Verificar console do servidor
- [ ] Verificar relatório de créditos (incluindo PDF)

---

## Progresso

| Categoria | Total | Concluídos | Percentual |
|-----------|-------|------------|------------|
| Componentes | 9 | 0 | 0% |
| Páginas | 6 | 0 | 0% |
| Arquivos de Mensagens | 2 | 0 | 0% |
| **TOTAL** | **17** | **0** | **0%** |

---

## Log de Alterações

| Data | Arquivo | Alteração |
|------|---------|-----------|
| - | - | - |

---

## Notas

1. O componente `PWAInstallPrompt.tsx` já usa i18n corretamente ✅
2. Alguns componentes importam `useTranslations` mas não usam em todos os lugares
3. A página 404 (`not-found.tsx`) tem muitos textos por ser um mini-jogo - considerar se vale traduzir tudo ou simplificar
4. O PDF de relatório de créditos precisa de atenção especial pois os textos são renderizados diretamente

