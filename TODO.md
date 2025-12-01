# 📋 TODO - Exaroton Servers Manager

> **Para IAs**: Sempre atualize este documento ao corrigir itens ou adicionar novos.

---

## 🐛 Bugs

### API chamada desnecessariamente ao trocar idioma
- **Status**: 🔴 Pendente
- **Criado**: 30/11/2025 22:55
- **Atualizado**: —
- **Descrição**: Ao trocar o idioma da página, a API é chamada novamente desnecessariamente.
- **Comportamento atual**: Toda troca de idioma dispara:
  - `GET /api/history?page=1&limit=10`
  - `GET /api/account`
- **Comportamento esperado**: Reutilizar dados já carregados e apenas atualizar textos traduzidos.
- **Páginas afetadas**: Todas (testado no painel admin)

---

## ✨ Melhorias

_Nenhuma melhoria pendente no momento._

---

## ✅ Concluídos

### Preparar repositório para open source
- **Status**: 🟢 Concluído
- **Criado**: 30/11/2025
- **Concluído**: 30/11/2025
- **Descrição**: Deixar o repositório profissional e bem documentado.
- **Checklist**:
  - [x] README completo com badges, screenshots, demo
  - [x] CONTRIBUTING.md com guia de contribuição
  - [x] GitHub Actions (CI/CD, linting, testes)
  - [x] Issue templates
  - [x] Pull request template
  - [x] Code of conduct
  - [x] License file atualizado
  - [x] Documentação de API

---

## 📝 Template para novos itens

```markdown
### Título descritivo do item
- **Status**: 🔴 Pendente | 🟡 Em progresso | 🟢 Concluído
- **Criado**: DD/MM/AAAA HH:MM
- **Atualizado**: —
- **Descrição**: Descrição clara do bug ou melhoria.
- **Passos para reproduzir**: (para bugs)
- **Comportamento esperado**: (para bugs)
```