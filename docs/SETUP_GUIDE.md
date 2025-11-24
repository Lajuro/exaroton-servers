# Guia de Configuração Detalhado

Este guia irá auxiliá-lo na configuração completa do Exaroton Servers Manager.

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Firebase](#configuração-do-firebase)
3. [Configuração do Exaroton](#configuração-do-exaroton)
4. [Instalação Local](#instalação-local)
5. [Primeiro Acesso](#primeiro-acesso)
6. [Deploy em Produção](#deploy-em-produção)
7. [Solução de Problemas](#solução-de-problemas)

## Pré-requisitos

### Software Necessário
- **Node.js** 18 ou superior
- **npm** ou **yarn**
- **Git**

### Contas Necessárias
- Conta Google (para autenticação)
- [Firebase](https://firebase.google.com/)
- [Exaroton](https://exaroton.com/)

## Configuração do Firebase

### 1. Criar Projeto

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite um nome para o projeto (ex: "exaroton-manager")
4. Desabilite o Google Analytics (opcional)
5. Clique em "Criar projeto"

### 2. Configurar Autenticação

1. No menu lateral, vá em **Authentication**
2. Clique em "Começar"
3. Na aba "Sign-in method", clique em "Google"
4. Ative o Google como provedor
5. Configure o email de suporte do projeto
6. Clique em "Salvar"

### 3. Configurar Firestore

1. No menu lateral, vá em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Selecione "Iniciar no modo de teste"
4. Escolha a localização (ex: southamerica-east1 para Brasil)
5. Clique em "Ativar"

#### Configurar Regras de Segurança

No Firestore, vá em "Regras" e substitua pelo seguinte:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Usuários podem ler seus próprios dados
      allow read: if request.auth != null && request.auth.uid == userId;
      // Apenas admins podem escrever
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

Clique em "Publicar".

### 4. Obter Credenciais do Projeto

#### Credenciais do Cliente (Web App)

1. Vá em **Configurações do Projeto** (ícone de engrenagem) > "Configurações do projeto"
2. Role até "Seus apps"
3. Clique no ícone Web (</>) para adicionar um app web
4. Digite um nome (ex: "Web App")
5. Copie as configurações do Firebase:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

#### Credenciais do Admin (Service Account)

1. Ainda em **Configurações do Projeto**
2. Vá na aba "Contas de serviço"
3. Clique em "Gerar nova chave privada"
4. Confirme e baixe o arquivo JSON
5. **IMPORTANTE**: Guarde este arquivo em um local seguro

No arquivo JSON, você encontrará:
- `project_id`
- `client_email`
- `private_key`

## Configuração do Exaroton

### 1. Criar Conta

1. Acesse [Exaroton](https://exaroton.com/)
2. Crie uma conta ou faça login
3. Adicione créditos à conta (necessário para rodar servidores)

### 2. Obter API Key

1. Clique no seu perfil (canto superior direito)
2. Vá em "Account"
3. Clique na aba "API"
4. Clique em "Generate API Key"
5. Copie a chave gerada
6. **IMPORTANTE**: Esta chave não será mostrada novamente

## Instalação Local

### 1. Clonar o Repositório

```bash
git clone https://github.com/Lajuro/exaroton-servers.git
cd exaroton-servers
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha com suas credenciais:

```env
# Firebase Client (do Firebase Console > Configurações do Projeto)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (do arquivo JSON da Service Account)
FIREBASE_ADMIN_PROJECT_ID=seu-projeto
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"

# Exaroton API
EXAROTON_API_KEY=sua_api_key_do_exaroton
```

**Dica**: Para a `FIREBASE_ADMIN_PRIVATE_KEY`, mantenha as quebras de linha como `\n`.

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## Primeiro Acesso

### 1. Fazer Login

1. Acesse a aplicação
2. Você será redirecionado para a página de login
3. Clique em "Entrar com Google"
4. Faça login com sua conta Google

### 2. Tornar-se Administrador

Na primeira vez, você precisa se tornar admin manualmente:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Firestore Database**
3. Encontre a coleção `users`
4. Clique no documento com seu UID (ID do usuário)
5. Clique em "Editar documento"
6. Altere o campo `isAdmin` para `true`
7. Clique em "Atualizar"

Agora você tem acesso administrativo!

### 3. Conceder Acesso a Servidores

Para usuários comuns:

1. Vá para o painel de Administração
2. Encontre o usuário na lista
3. Clique em "Gerenciar Acessos"
4. Conceda acesso aos servidores desejados

## Deploy em Produção

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Acesse [Vercel](https://vercel.com/)
3. Clique em "Import Project"
4. Selecione seu repositório
5. Configure as variáveis de ambiente (mesmo do `.env`)
6. Clique em "Deploy"

### Outras Plataformas

O app também pode ser deployado em:
- **Netlify**
- **Railway**
- **Render**
- Qualquer plataforma com suporte a Node.js

## Solução de Problemas

### Erro: "Firebase: Error (auth/invalid-api-key)"
- Verifique se as variáveis `NEXT_PUBLIC_FIREBASE_*` estão corretas
- Confirme que copiou as credenciais do projeto correto

### Erro: "Service account object must contain a string 'project_id'"
- Verifique se `FIREBASE_ADMIN_*` estão configuradas
- Certifique-se de que a `PRIVATE_KEY` mantém as quebras de linha como `\n`

### Erro: "EXAROTON_API_KEY is not defined"
- Verifique se a variável `EXAROTON_API_KEY` está no `.env`
- Confirme que a API key está válida no Exaroton

### Não consigo ver servidores
- **Admin**: Verifique se a API key do Exaroton está correta
- **Usuário comum**: Peça a um admin para conceder acesso aos servidores

### Não consigo parar um servidor
- Usuários comuns só podem parar servidores sem jogadores online
- Verifique se há jogadores conectados
- Admins podem parar a qualquer momento

## Suporte

Se precisar de ajuda:
- Abra uma [issue no GitHub](https://github.com/Lajuro/exaroton-servers/issues)
- Consulte a [documentação do Firebase](https://firebase.google.com/docs)
- Consulte a [documentação do Exaroton](https://exaroton.com/docs)
