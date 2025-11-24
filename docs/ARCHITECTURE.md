# Arquitetura do Sistema

## Visão Geral

O Exaroton Servers Manager é uma aplicação web construída com Next.js que permite gerenciar servidores Minecraft hospedados no Exaroton através de uma interface web segura e intuitiva.

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Login     │  │  Dashboard   │  │    Admin     │      │
│  │    Page      │  │    Page      │  │    Panel     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                 ┌──────────▼──────────┐                      │
│                 │   Auth Context      │                      │
│                 │  (Firebase Auth)    │                      │
│                 └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Next.js App (Server)                      │
├─────────────────────────────────────────────────────────────┤
│  API Routes:                                                 │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │  /api/servers      │  │  /api/users        │            │
│  │  - GET /           │  │  - GET /           │            │
│  │  - GET /[id]       │  │  - PUT /[id]/role  │            │
│  │  - POST /start     │  │  - PUT /access     │            │
│  │  - POST /stop      │  │                     │            │
│  │  - POST /restart   │  │                     │            │
│  │  - GET /players    │  │                     │            │
│  └────────────────────┘  └────────────────────┘            │
│           │                        │                         │
│           │                        │                         │
│  ┌────────▼────────┐      ┌───────▼────────┐               │
│  │ Firebase Admin  │      │ Firebase Admin │               │
│  │ (Auth Verify)   │      │ (Firestore)    │               │
│  └─────────────────┘      └────────────────┘               │
└─────────────────────────────────────────────────────────────┘
           │                         │
           │                         │
┌──────────▼─────────┐    ┌─────────▼──────────┐
│  Firebase          │    │   Firestore DB     │
│  Authentication    │    │   ┌─────────────┐  │
│                    │    │   │   users     │  │
│  - Google OAuth    │    │   │  - uid      │  │
│                    │    │   │  - isAdmin  │  │
│                    │    │   │  - access   │  │
└────────────────────┘    │   └─────────────┘  │
                          └────────────────────┘
                                    
┌─────────────────────────────────────────────┐
│         Exaroton API                        │
│  - GET /servers                             │
│  - GET /servers/{id}                        │
│  - POST /servers/{id}/start                 │
│  - POST /servers/{id}/stop                  │
│  - POST /servers/{id}/restart               │
└─────────────────────────────────────────────┘
```

## Fluxo de Autenticação

```
1. Usuário → Página de Login
2. Clica em "Entrar com Google"
3. Firebase Auth → Google OAuth
4. Google retorna token
5. Firebase cria/atualiza usuário
6. App busca/cria documento no Firestore
7. Usuário redirecionado ao Dashboard
```

## Fluxo de Autorização

### Para Operações de Servidor

```
1. Cliente faz requisição com token JWT
2. API verifica token com Firebase Admin
3. API busca dados do usuário no Firestore
4. API verifica permissões:
   - isAdmin: acesso total
   - serverAccess: lista de servidores permitidos
5. Se autorizado, executa operação via Exaroton API
6. Retorna resultado ao cliente
```

### Para Operação de Stop (Usuários Comuns)

```
1. Cliente requisita stop de servidor
2. API verifica autenticação
3. API verifica se usuário é admin
4. Se não for admin:
   a. API consulta players online via Exaroton
   b. Se houver players, rejeita operação
   c. Se não houver players, permite stop
5. Executa operação via Exaroton API
```

## Componentes Principais

### Frontend (Client-Side)

#### `app/page.tsx`
- Página inicial com redirecionamento automático
- Redireciona para /login ou /dashboard baseado no estado de auth

#### `app/login/page.tsx`
- Interface de login com Google
- Gerencia o fluxo de autenticação

#### `app/dashboard/page.tsx`
- Dashboard principal do usuário
- Lista servidores acessíveis
- Permite controlar servidores (start/stop)
- Mostra status e jogadores online

#### `app/admin/page.tsx`
- Painel administrativo
- Lista todos os usuários
- Gerencia roles (admin/user)
- Gerencia acesso a servidores

#### `components/ServerCard.tsx`
- Card individual de servidor
- Botões de controle
- Display de status e players

#### `lib/auth-context.tsx`
- Context do React para autenticação
- Gerencia estado global do usuário
- Fornece funções de login/logout

### Backend (Server-Side)

#### `lib/firebase.ts`
- Configuração Firebase Client
- Inicialização do Auth e Firestore

#### `lib/firebase-admin.ts`
- Configuração Firebase Admin SDK
- Usado para operações server-side seguras

#### `lib/exaroton.ts`
- Cliente da API do Exaroton
- Funções para controlar servidores

#### API Routes (`app/api/`)
- Endpoints protegidos por autenticação
- Validação de permissões
- Integração com Exaroton

## Modelo de Dados

### Firestore - Collection: `users`

```typescript
{
  uid: string;              // ID do usuário (do Firebase Auth)
  email: string;            // Email do usuário
  displayName: string;      // Nome para exibição
  photoURL?: string;        // URL da foto do perfil
  isAdmin: boolean;         // Se é administrador
  serverAccess: string[];   // IDs dos servidores com acesso
  createdAt: Date;          // Data de criação
  updatedAt: Date;          // Data da última atualização
}
```

## Tecnologias Utilizadas

### Frontend
- **Next.js 16**: Framework React com SSR/SSG
- **React 19**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização utility-first

### Backend
- **Next.js API Routes**: Endpoints serverless
- **Firebase Auth**: Autenticação
- **Firebase Admin SDK**: Operações privilegiadas
- **Firestore**: Banco de dados NoSQL

### Integrações
- **Exaroton API**: Controle de servidores Minecraft
- **Google OAuth**: Provedor de autenticação

## Segurança

### Camadas de Segurança

1. **Autenticação**: Todo acesso requer login com Google
2. **Autorização**: Verificação de permissões em cada operação
3. **API Protection**: Todas as rotas verificam tokens JWT
4. **Firestore Rules**: Regras de segurança no banco de dados
5. **Environment Variables**: Credenciais nunca expostas no cliente

### Princípios de Segurança Aplicados

- **Least Privilege**: Usuários têm apenas as permissões necessárias
- **Defense in Depth**: Múltiplas camadas de validação
- **Separation of Concerns**: Client/Admin SDK separados
- **Secure by Default**: Acesso negado por padrão

## Escalabilidade

### Pontos de Escalabilidade

1. **Next.js**: Escalabilidade horizontal automática em plataformas serverless
2. **Firebase**: Escalabilidade gerenciada pelo Google
3. **Firestore**: Auto-scaling de banco de dados
4. **API Routes**: Stateless, facilmente escaláveis

### Limitações

- **Exaroton API**: Rate limits da API do Exaroton
- **Firebase**: Quotas gratuitas do Firebase
- **Firestore**: Limites de leitura/escrita

## Performance

### Otimizações Implementadas

1. **Client-Side Rendering**: Páginas autenticadas não são pré-renderizadas
2. **API Caching**: Possível implementar cache de servidores
3. **Lazy Loading**: Componentes carregados sob demanda
4. **Bundle Optimization**: Tree shaking automático do Next.js

## Monitoramento e Logs

### Logs Disponíveis

- **Console Logs**: Erros são logados no console
- **Firebase Console**: Logs de autenticação
- **Vercel Logs**: Logs de API routes (se deployado na Vercel)

### Métricas Sugeridas

- Taxa de sucesso de autenticação
- Tempo de resposta das APIs
- Erros de servidor
- Uso de servidores

## Próximos Passos

### Melhorias Futuras

1. **Real-time Updates**: WebSocket para status de servidores
2. **Notificações**: Alertas quando servidor inicia/para
3. **Analytics**: Dashboard com métricas de uso
4. **Backup/Restore**: Gerenciamento de backups via interface
5. **Console Integration**: Terminal integrado para comandos
6. **Scheduling**: Agendamento de start/stop de servidores
7. **Billing Integration**: Visualização de custos
8. **Multi-language**: Suporte a múltiplos idiomas
