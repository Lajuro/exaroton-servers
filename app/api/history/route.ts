import { NextRequest, NextResponse } from 'next/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { ActionLog, ActionType } from '@/types';

// Helper to verify admin token
async function verifyAdminToken(request: NextRequest): Promise<{ uid: string; email: string; name: string; photoURL?: string; isAdmin: boolean } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const auth = adminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check isAdmin in Firestore since custom claims might not be set
    const db = adminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true || decodedToken.admin === true;
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || userData?.displayName || decodedToken.email || 'Unknown',
      photoURL: decodedToken.picture || userData?.photoURL,
      isAdmin,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * GET /api/history - Buscar histórico de ações
 * Query params:
 * - userId: filtrar por usuário
 * - serverId: filtrar por servidor
 * - type: filtrar por tipo de ação (pode ser múltiplos separados por vírgula)
 * - startDate: data inicial (ISO string)
 * - endDate: data final (ISO string)
 * - success: filtrar por sucesso (true/false)
 * - limit: limite de resultados (default: 50, max: 200)
 * - page: página atual (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminToken(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const serverId = searchParams.get('serverId');
    const types = searchParams.get('type')?.split(',') as ActionType[] | undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const successStr = searchParams.get('success');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Build query
    let query = db.collection('actionLogs').orderBy('timestamp', 'desc');

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (serverId) {
      query = query.where('serverId', '==', serverId);
    }

    if (types && types.length === 1) {
      query = query.where('type', '==', types[0]);
    }

    if (startDateStr) {
      const startDate = new Date(startDateStr);
      query = query.where('timestamp', '>=', Timestamp.fromDate(startDate));
    }

    if (endDateStr) {
      const endDate = new Date(endDateStr);
      query = query.where('timestamp', '<=', Timestamp.fromDate(endDate));
    }

    if (successStr !== null && successStr !== undefined) {
      query = query.where('success', '==', successStr === 'true');
    }

    // Get total count (approximate)
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Get paginated results
    const snapshot = await query.offset(offset).limit(limit).get();

    const logs: ActionLog[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhotoUrl: data.userPhotoUrl,
        timestamp: data.timestamp?.toDate() || new Date(),
        serverId: data.serverId,
        serverName: data.serverName,
        targetUserId: data.targetUserId,
        targetUserName: data.targetUserName,
        details: data.details,
        success: data.success,
        errorMessage: data.errorMessage,
      };
    });

    // Filter by multiple types client-side if needed
    const filteredLogs = types && types.length > 1
      ? logs.filter(log => types.includes(log.type))
      : logs;

    return NextResponse.json({
      logs: filteredLogs,
      total,
      hasMore: offset + limit < total,
      page,
      pageSize: limit,
    });
  } catch (error) {
    console.error('Error fetching action logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/history - Registrar nova ação
 * Body: Partial<ActionLog>
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb();
    const body = await request.json();
    const { type, serverId, serverName, targetUserId, targetUserName, details, success = true, errorMessage } = body;

    if (!type) {
      return NextResponse.json({ error: 'Action type is required' }, { status: 400 });
    }

    const actionLog: Omit<ActionLog, 'id'> = {
      type,
      userId: user.uid,
      userName: user.name,
      userEmail: user.email,
      userPhotoUrl: user.photoURL,
      timestamp: new Date(),
      serverId,
      serverName,
      targetUserId,
      targetUserName,
      details,
      success,
      errorMessage,
    };

    const docRef = await db.collection('actionLogs').add({
      ...actionLog,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      log: { ...actionLog, id: docRef.id },
    });
  } catch (error) {
    console.error('Error creating action log:', error);
    return NextResponse.json(
      { error: 'Failed to create action log' },
      { status: 500 }
    );
  }
}
