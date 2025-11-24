/**
 * Script para definir um usuário como admin
 * Usage: node scripts/set-admin.js <user-email>
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

async function setUserAdmin(email) {
  try {
    console.log(`🔍 Buscando usuário: ${email}`);
    
    // Buscar usuário por email
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;
    
    console.log(`✅ Usuário encontrado: ${userRecord.displayName || userRecord.email}`);
    console.log(`   UID: ${uid}`);
    
    // Definir custom claim de admin
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Custom claim 'admin' definida no Authentication`);
    
    // Atualizar documento no Firestore
    const userDoc = db.collection('users').doc(uid);
    const docSnapshot = await userDoc.get();
    
    if (docSnapshot.exists) {
      await userDoc.update({
        isAdmin: true,
        updatedAt: new Date(),
      });
      console.log(`✅ Campo 'isAdmin' atualizado no Firestore`);
    } else {
      await userDoc.set({
        email: userRecord.email,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Documento de usuário criado no Firestore`);
    }
    
    console.log('');
    console.log('🎉 Sucesso! Usuário agora é admin.');
    console.log('⚠️  IMPORTANTE: O usuário precisa fazer LOGOUT e LOGIN novamente para que as mudanças tenham efeito.');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Pegar email dos argumentos
const email = process.argv[2];

if (!email) {
  console.error('❌ Uso: node scripts/set-admin.js <user-email>');
  console.error('   Exemplo: node scripts/set-admin.js roberto.camargo.1996@gmail.com');
  process.exit(1);
}

setUserAdmin(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
