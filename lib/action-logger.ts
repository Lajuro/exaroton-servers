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

    const docRef = await db.collection('actionLogs').add({
      ...actionLog,
      timestamp: FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error logging action:', error);
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
