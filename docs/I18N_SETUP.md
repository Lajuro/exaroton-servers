# Internacionalização (i18n)

O MineServerManager suporta múltiplos idiomas usando `next-intl`.

## Idiomas Suportados

- 🇧🇷 Português (Brasil) - `pt-BR` (padrão)
- 🇺🇸 English - `en`

## Estrutura

```
messages/
├── pt-BR.json    # Traduções em português
└── en.json       # Traduções em inglês

lib/
├── i18n.ts       # Configuração do next-intl
└── useTranslations.ts  # Hook cliente

components/
└── LanguageSwitcher.tsx  # Seletor de idioma
```

## Configuração

### next.config.ts

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

export default withNextIntl(nextConfig);
```

### lib/i18n.ts

```typescript
import { getRequestConfig } from 'next-intl/server';

export const locales = ['pt-BR', 'en'];
export const defaultLocale = 'pt-BR';

export default getRequestConfig(async () => {
  const locale = await getLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

## Uso

### Em Componentes Cliente

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('servers');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('status.online')}</p>
    </div>
  );
}
```

### Com Parâmetros

```tsx
// messages/pt-BR.json
{
  "dashboard": {
    "welcome": "Bem-vindo, {name}!"
  }
}

// Componente
const t = useTranslations('dashboard');
<p>{t('welcome', { name: 'Roberto' })}</p>
// Resultado: "Bem-vindo, Roberto!"
```

### Com Pluralização

```tsx
// messages/pt-BR.json
{
  "servers": {
    "players": "{count, plural, =0 {Sem jogadores} =1 {1 jogador} other {# jogadores}}"
  }
}

// Componente
const t = useTranslations('servers');
<p>{t('players', { count: 5 })}</p>
// Resultado: "5 jogadores"
```

## Estrutura das Mensagens

### Namespaces

- `common` - Textos comuns (loading, error, buttons)
- `auth` - Autenticação
- `navbar` - Navegação
- `credits` - Sistema de créditos
- `servers` - Gerenciamento de servidores
- `dashboard` - Dashboard
- `admin` - Painel admin
- `pwa` - Progressive Web App
- `errors` - Mensagens de erro
- `time` - Formatação de tempo

### Exemplo de Estrutura

```json
{
  "namespace": {
    "key": "valor simples",
    "nested": {
      "key": "valor aninhado"
    },
    "withParam": "Olá, {name}!"
  }
}
```

## Detecção de Idioma

A ordem de prioridade para detectar o idioma:

1. Cookie `NEXT_LOCALE`
2. Header `Accept-Language` do navegador
3. Idioma padrão (`pt-BR`)

## Trocando de Idioma

O componente `LanguageSwitcher` permite ao usuário trocar de idioma:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Na navbar
<LanguageSwitcher />
```

Ao trocar:
1. Cookie `NEXT_LOCALE` é definido
2. Página é recarregada com `router.refresh()`
3. Server Components recebem novo idioma

## Adicionando Novas Traduções

### 1. Adicione a chave em ambos arquivos

`messages/pt-BR.json`:
```json
{
  "feature": {
    "newKey": "Novo texto em português"
  }
}
```

`messages/en.json`:
```json
{
  "feature": {
    "newKey": "New text in English"
  }
}
```

### 2. Use no componente

```tsx
const t = useTranslations('feature');
<p>{t('newKey')}</p>
```

## Adicionando Novo Idioma

1. Crie o arquivo `messages/es.json` (exemplo: espanhol)
2. Atualize `lib/i18n.ts`:
   ```typescript
   export const locales = ['pt-BR', 'en', 'es'];
   ```
3. Atualize `components/LanguageSwitcher.tsx`:
   ```typescript
   const locales = ['pt-BR', 'en', 'es'];
   const localeNames = { ..., 'es': 'Español' };
   const localeFlags = { ..., 'es': '🇪🇸' };
   ```

## Boas Práticas

1. **Use namespaces** - Organize por funcionalidade
2. **Evite textos hardcoded** - Sempre use `t()`
3. **Mantenha sincronizado** - Ao adicionar em pt-BR, adicione em en
4. **Use interpolação** - Para valores dinâmicos
5. **Contexto claro** - Chaves devem ser auto-explicativas

## Troubleshooting

### "Missing message" warning

Verifique se a chave existe em ambos os arquivos de tradução.

### Tradução não atualiza

1. Limpe o cache do navegador
2. Verifique se salvou o arquivo `.json`
3. Reinicie o servidor de desenvolvimento

### Erro de tipo

Se TypeScript reclama da chave:
```typescript
// Use 'as const' ou defina os tipos corretamente
const t = useTranslations('namespace');
t('key'); // deve funcionar se 'key' existe no namespace
```
