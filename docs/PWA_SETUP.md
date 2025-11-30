# Progressive Web App (PWA)

O MineServerManager é uma Progressive Web App (PWA), oferecendo uma experiência similar a um aplicativo nativo.

## Funcionalidades

### 1. Instalação no Dispositivo

O app pode ser instalado em:
- **Desktop**: Chrome, Edge, Firefox (parcial)
- **Mobile**: Android (Chrome, Samsung Internet), iOS (Safari)

Quando instalado:
- Abre em janela própria sem barras do navegador
- Ícone na tela inicial/área de trabalho
- Aparece na lista de apps do sistema

### 2. Funcionamento Offline

Com o Service Worker, o app oferece:

#### Cache de Recursos Estáticos
- HTML, CSS, JavaScript
- Imagens e ícones
- Fontes

#### Cache de API (Network First)
- Dados de servidores
- Informações da conta
- Histórico de créditos

Quando offline:
- Páginas carregam do cache
- Dados são exibidos da última sincronização
- Indicador visual de status offline

### 3. Atualizações Automáticas

O Service Worker atualiza automaticamente quando há novas versões disponíveis.

## Configuração

### manifest.json

```json
{
  "name": "MineServerManager",
  "short_name": "MSM",
  "description": "Gerencie seus servidores Minecraft...",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#4ade80",
  "icons": [...]
}
```

### next.config.ts

```typescript
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      // Configurações de cache...
    ],
  },
});

export default withPWA(nextConfig);
```

## Componentes

### PWAInstallPrompt

Componente que gerencia:
- Detecção de evento `beforeinstallprompt`
- Dialog de instalação com benefícios
- Botão flutuante de instalação
- Persistência de dismissal (7 dias)

```tsx
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

// No layout principal
<PWAInstallPrompt />
```

### OnlineStatus

Indicador na navbar quando offline:

```tsx
import { OnlineStatus } from "@/components/PWAInstallPrompt";

// Na navbar
<OnlineStatus />
```

## Estratégias de Cache

### NetworkFirst (APIs)

Usado para dados que precisam estar atualizados:
- `/api/servers/*` - Dados de servidores
- `/api/account` - Informações da conta
- `/api/credits/*` - Dados de créditos
- `api.exaroton.com/*` - API externa

Timeout: 10 segundos, depois usa cache.

### CacheFirst (Assets)

Usado para recursos estáticos:
- `storage.googleapis.com` - Ícones de servidores
- `firebasestorage.app` - Arquivos do Firebase

Expiração: 7 dias, máximo 100 entradas.

## Testando PWA

### Desenvolvimento

O PWA é desabilitado em desenvolvimento (`disable: true`).

Para testar:
1. Faça build de produção: `npm run build`
2. Inicie servidor de produção: `npm start`
3. Acesse via HTTPS ou localhost

### Lighthouse

Use o DevTools do Chrome:
1. Abra DevTools (F12)
2. Vá em "Lighthouse"
3. Execute auditoria de PWA

### Verificações

- [ ] manifest.json está correto
- [ ] Service Worker está registrado
- [ ] Ícones em todos os tamanhos
- [ ] App instalável
- [ ] Funciona offline
- [ ] Atualiza automaticamente

## Ícones Necessários

O manifest.json espera:
- `/logo_msm.svg` - SVG vetorial (qualquer tamanho)
- `/icon-192.png` - PNG 192x192
- `/icon-512.png` - PNG 512x512

Para iOS também é útil:
- `/apple-icon.png` - Apple Touch Icon

## Troubleshooting

### App não instala

1. Verifique se está em HTTPS
2. Confirme que manifest.json está correto
3. Veja erros no Console do DevTools

### Cache não funciona

1. Limpe cache do navegador
2. Desregistre o Service Worker
3. Faça novo build

### Service Worker não atualiza

1. Close todas as abas do app
2. Reabra o app
3. O SW deve atualizar automaticamente

## Arquivos Gerados

O build gera na pasta `/public`:
- `sw.js` - Service Worker principal
- `sw.js.map` - Source map
- `workbox-*.js` - Biblioteca Workbox

Esses arquivos estão no `.gitignore`.
