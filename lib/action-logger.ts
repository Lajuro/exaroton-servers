import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { ActionLog, ActionType } from '@/types';

/**
 * Helper para registrar ações no histórico
 * Pode ser usado em qualquer route handler
 */
export async function logAction(action: {
  type: ActionType;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoUrl?: string;
  serverId?: string;
  serverName?: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: ActionLog['details'];
  success?: boolean;
  errorMessage?: string;
}): Promise<string | null> {
  try {
    const db = adminDb();
    
    const actionLog: Omit<ActionLog, 'id'> = {
      type: action.type,
      userId: action.userId,
      userName: action.userName,
      userEmail: action.userEmail,
      userPhotoUrl: action.userPhotoUrl,
      timestamp: new Date(),
      serverId: action.serverId,
      serverName: action.serverName,
      targetUserId: action.targetUserId,
      targetUserName: action.targetUserName,
      details: action.details,
      success: action.success ?? true,
      errorMessage: action.errorMessage,
    };

    // Remove undefined values to avoid Firestore errors
    const cleanedLog = Object.fromEntries(
      Object.entries(actionLog).filter(([_, v]) => v !== undefined)
    );

    console.log('[action-logger] Saving action:', action.type, 'for user:', action.userId);
    
    const docRef = await db.collection('actionLogs').add({
      ...cleanedLog,
      timestamp: FieldValue.serverTimestamp(),
    });

    console.log('[action-logger] Action saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    // Log detailed error but don't throw - we don't want logging failures to break main operations
    console.error('[action-logger] Error logging action:', error);
    console.error('[action-logger] Action that failed:', JSON.stringify(action, null, 2));
    return null;
  }
}

/**
 * Helper para obter informações do usuário decodificado
 */
export function getUserInfoFromToken(decodedToken: {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  admin?: boolean;
}) {
  return {
    uid: decodedToken.uid,
    email: decodedToken.email || '',
    name: decodedToken.name || decodedToken.email || 'Unknown',
    photoURL: decodedToken.picture,
    isAdmin: decodedToken.admin === true,
  };
}
