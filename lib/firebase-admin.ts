import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getFirebaseAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { ServerCache, ExarotonServer } from '@/types';

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
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    };
    
    const app = initializeApp(firebaseAdminConfig);
    // Safe init log to help diagnose project mismatch during setup
    console.log('[firebase-admin] Initialized:');
    console.log('  admin.project_id:', process.env.FIREBASE_ADMIN_PROJECT_ID);
    console.log('  admin.client_email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.log('  client.project_id:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    }
    return app;
  }
  return getApps()[0];
}

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let cachedStorage: Storage | null = null;

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

export function adminStorage(): Storage {
  if (!cachedStorage) {
    cachedStorage = getStorage(getAdminApp());
  }
  return cachedStorage;
}

// ========================================
// CACHE HELPERS
// ========================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Busca servidor do cache se ainda válido (TTL de 5 minutos)
 */
export async function getCachedServer(serverId: string): Promise<ExarotonServer | null> {
  try {
    const cacheDoc = await adminDb().collection('serverCache').doc(serverId).get();
    
    if (!cacheDoc.exists) {
      return null;
    }
    
    const cacheData = cacheDoc.data() as ServerCache;
    const now = new Date();
    const expiresAt = cacheData.expiresAt instanceof Date 
      ? cacheData.expiresAt 
      : (cacheData.expiresAt as any).toDate();
    
    // Verifica se cache expirou
    if (expiresAt < now) {
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.error('[getCachedServer] Error:', error);
    return null;
  }
}

/**
 * Armazena servidor no cache com TTL de 5 minutos
 */
export async function setCachedServer(serverId: string, data: ExarotonServer): Promise<void> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
    
    // Serializa para plain object (Firestore não aceita objetos com protótipos customizados)
    const plainData = JSON.parse(JSON.stringify(data));
    
    const cacheData: ServerCache = {
      serverId,
      data: plainData,
      cachedAt: now,
      expiresAt,
      lastFetched: now,
    };
    
    await adminDb().collection('serverCache').doc(serverId).set(cacheData);
  } catch (error) {
    console.error('[setCachedServer] Error:', error);
    // Não lançar erro - cache é opcional
  }
}

/**
 * Invalida cache de um servidor (após start/stop/restart)
 */
export async function invalidateServerCache(serverId: string): Promise<void> {
  try {
    await adminDb().collection('serverCache').doc(serverId).delete();
  } catch (error) {
    console.error('[invalidateServerCache] Error:', error);
    // Não lançar erro - invalidação é best-effort
  }
}

/**
 * Invalida todos os caches (útil para manutenção)
 */
export async function invalidateAllServerCaches(): Promise<void> {
  try {
    const snapshot = await adminDb().collection('serverCache').get();
    const batch = adminDb().batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('[invalidateAllServerCaches] Error:', error);
  }
}
