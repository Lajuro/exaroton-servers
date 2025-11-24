# Scripts de Administração

Esta pasta contém scripts auxiliares para gerenciar usuários admin do sistema.

## 📋 Scripts Disponíveis

### `list-users.js`
Lista todos os usuários cadastrados no Firebase Authentication e seus status de admin.

**Uso:**
```bash
node scripts/list-users.js
```

**Saída:**
```
📋 Listando usuários...

✅ 2 usuário(s) encontrado(s):

👤 Roberto Camargo
   📧 Email: roberto.camargo.1996@gmail.com
   🆔 UID: jEwu1MHkvFTRPWJET3kWYJS67o92
   ⭐ ADMIN (Custom Claim)
   ⭐ ADMIN (Firestore)

👤 João Silva
   📧 Email: joao@example.com
   🆔 UID: abc123xyz
   👥 Usuário comum
```

---

### `set-admin.js`
Define um usuário como administrador do sistema.

**Uso:**
```bash
node scripts/set-admin.js <email-do-usuario>
```

**Exemplo:**
```bash
node scripts/set-admin.js roberto.camargo.1996@gmail.com
```

**O que o script faz:**
1. ✅ Busca o usuário pelo email no Firebase Authentication
2. ✅ Define a custom claim `admin: true` no token JWT
3. ✅ Atualiza/cria o campo `isAdmin: true` no Firestore
4. ✅ Registra timestamps de criação/atualização

**⚠️ IMPORTANTE:** 
Depois de executar o script, o usuário **PRECISA** fazer:
1. Logout da aplicação
2. Login novamente

Isso é necessário para que o Firebase gere um novo token JWT com as custom claims atualizadas.

---

## 🚀 Como tornar o primeiro usuário admin

Se você é o primeiro usuário e precisa se tornar admin:

### Passo 1: Liste os usuários (opcional)
```bash
node scripts/list-users.js
```

### Passo 2: Torne seu usuário admin
```bash
node scripts/set-admin.js seu-email@gmail.com
```

### Passo 3: Logout e Login
1. Na aplicação, clique no seu avatar no canto superior direito
2. Clique em "Logout"
3. Faça login novamente com Google

### Passo 4: Verifique
1. Acesse `/admin` na aplicação
2. Você deve ver a página de administração
3. Agora pode promover outros usuários a admin pela interface

---

## 🔧 Requisitos

- Node.js instalado
- Arquivo `.env.local` configurado com:
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY`

---

## 🔐 Segurança

Estes scripts têm acesso total ao Firebase Admin SDK. Use com cuidado:

- ⚠️ Nunca commite estes scripts com credenciais hardcoded
- ⚠️ Mantenha o `.env.local` fora do git
- ⚠️ Limite o número de admins (princípio do menor privilégio)
- ✅ Use estes scripts apenas em ambiente de desenvolvimento local

---

## 📝 Notas Técnicas

### Custom Claims vs Firestore

O sistema usa **dois** locais para armazenar o status de admin:

1. **Custom Claims (Firebase Auth):** 
   - Incluída no JWT token
   - Verificada no backend para autorização
   - Requer logout/login para atualizar

2. **Firestore (campo `isAdmin`):**
   - Usado pela interface admin para mostrar status
   - Atualizado em tempo real
   - Permite controle fino de permissões

Ambos devem estar sincronizados para o sistema funcionar corretamente.
