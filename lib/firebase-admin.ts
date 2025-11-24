import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getFirebaseAuth, Auth } from 'firebase-admin/auth';

function initAdmin(): App {
  if (getApps().length === 0) {
    // Check if required env vars are present
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || 
        !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
        !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error('Firebase Admin credentials are not configured');
    }

    const firebaseAdminConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    };
    
    return initializeApp(firebaseAdminConfig);
  }
  return getApps()[0];
}

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

export function getAdminApp(): App {
  if (!cachedApp) {
    cachedApp = initAdmin();
  }
  return cachedApp;
}

export function adminDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(getAdminApp());
  }
  return cachedDb;
}

export function adminAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getFirebaseAuth(getAdminApp());
  }
  return cachedAuth;
}
