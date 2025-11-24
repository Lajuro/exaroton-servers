/**
 * Script para listar todos os usuários
 * Usage: node scripts/list-users.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Verificar variáveis de ambiente
if (!process.env.FIREBASE_ADMIN_PROJECT_ID || 
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente do Firebase Admin não configuradas!');
  console.error('');
  console.error('Certifique-se de que o arquivo .env.local existe com:');
  console.error('  FIREBASE_ADMIN_PROJECT_ID=...');
  console.error('  FIREBASE_ADMIN_CLIENT_EMAIL=...');
  console.error('  FIREBASE_ADMIN_PRIVATE_KEY=...');
  console.error('');
  process.exit(1);
}

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function listUsers() {
  try {
    console.log('📋 Listando usuários...\n');
    
    // Listar usuários do Authentication
    const listUsersResult = await auth.listUsers(1000);
    
    if (listUsersResult.users.length === 0) {
      console.log('ℹ️  Nenhum usuário encontrado.');
      return;
    }
    
    console.log(`✅ ${listUsersResult.users.length} usuário(s) encontrado(s):\n`);
    
    for (const userRecord of listUsersResult.users) {
      console.log(`👤 ${userRecord.displayName || '(Sem nome)'}`);
      console.log(`   📧 Email: ${userRecord.email}`);
      console.log(`   🆔 UID: ${userRecord.uid}`);
      
      // Verificar custom claims
      const customClaims = userRecord.customClaims || {};
      const isAdminClaim = customClaims.admin === true;
      
      // Verificar no Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const isAdminFirestore = userData?.isAdmin === true;
      
      if (isAdminClaim) {
        console.log(`   ⭐ ADMIN (Custom Claim)`);
      }
      if (isAdminFirestore) {
        console.log(`   ⭐ ADMIN (Firestore)`);
      }
      if (!isAdminClaim && !isAdminFirestore) {
        console.log(`   👥 Usuário comum`);
      }
      
      console.log('');
    }
    
    console.log('💡 Para tornar um usuário admin, execute:');
    console.log('   node scripts/set-admin.js <email>\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

listUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
