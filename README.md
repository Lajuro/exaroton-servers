# Exaroton Servers Manager

Um gerenciador de servidores de Minecraft hospedados no Exaroton, construído com Next.js, TypeScript e Firebase.

## Recursos

- 🔐 Autenticação com Google via Firebase
- 👥 Sistema de permissões (Admin e Usuário Comum)
- 🎮 Controle de servidores Minecraft do Exaroton
- 🔒 Controle de acesso granular por servidor
- 📊 Visualização de status e jogadores online

## Permissões

### Usuário Comum
- Pode iniciar servidores aos quais tem acesso
- Pode parar servidores somente quando não há jogadores online

### Administrador
- Acesso total a todos os servidores
- Pode iniciar, parar e reiniciar servidores
- Pode gerenciar permissões de outros usuários
- Pode conceder ou revogar acesso de usuários a servidores específicos
- Pode promover ou remover outros usuários como administradores

## Configuração

### 1. Pré-requisitos

- Node.js 18+ instalado
- Uma conta no Firebase
- Uma conta no Exaroton com API key

### 2. Firebase Setup

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative a autenticação com Google em Authentication > Sign-in method
3. Crie um banco de dados Firestore
4. Obtenha as credenciais do projeto em Project Settings
5. Crie uma Service Account e baixe o arquivo JSON em Project Settings > Service Accounts

### 3. Exaroton API Key

1. Acesse [Exaroton](https://exaroton.com/)
2. Vá em Account > API
3. Gere uma nova API key

### 4. Configuração do Projeto

1. Clone o repositório:
```bash
git clone https://github.com/Lajuro/exaroton-servers.git
cd exaroton-servers
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

4. Preencha as variáveis de ambiente no arquivo `.env`:

```env
# Firebase Configuration (do Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Firebase Admin SDK (do Service Account JSON)
FIREBASE_ADMIN_PROJECT_ID=seu_projeto_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@seu_projeto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Exaroton API
EXAROTON_API_KEY=sua_exaroton_api_key
```

5. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

6. Acesse http://localhost:3000

### 5. Primeiro Acesso

1. Faça login com sua conta Google
2. O primeiro usuário precisa ser promovido a admin manualmente no Firestore:
   - Acesse o Firebase Console
   - Vá em Firestore Database
   - Encontre o documento do seu usuário na coleção `users`
   - Edite o campo `isAdmin` para `true`

## Deploy

### Vercel

1. Faça o push do código para o GitHub
2. Importe o projeto no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy!

## Estrutura do Projeto

```
exaroton-servers/
├── app/
│   ├── api/              # API routes
│   │   ├── servers/      # Endpoints de servidores
│   │   └── users/        # Endpoints de usuários
│   ├── dashboard/        # Dashboard do usuário
│   ├── admin/            # Painel administrativo
│   ├── login/            # Página de login
│   └── layout.tsx        # Layout principal
├── components/           # Componentes React
├── lib/                  # Utilidades e configurações
│   ├── firebase.ts       # Config Firebase Client
│   ├── firebase-admin.ts # Config Firebase Admin
│   ├── exaroton.ts       # Cliente Exaroton
│   └── auth-context.tsx  # Context de autenticação
├── types/                # Tipos TypeScript
└── .env.example          # Exemplo de variáveis de ambiente
```

## Tecnologias

- [Next.js 16](https://nextjs.org/) - Framework React
- [TypeScript](https://www.typescriptlang.org/) - Linguagem
- [Firebase](https://firebase.google.com/) - Autenticação e Database
- [Tailwind CSS](https://tailwindcss.com/) - Estilização
- [Exaroton API](https://exaroton.com/) - API de servidores Minecraft

## Licença

MIT
