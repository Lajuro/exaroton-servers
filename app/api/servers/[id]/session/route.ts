import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';
import { ActiveServerSession, ServerSession } from '@/types';

/**
 * GET /api/servers/[id]/session
 * Retorna a sessão ativa do servidor (se existir)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      await adminAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Buscar sessão ativa do servidor
    const sessionsRef = adminDb().collection('serverSessions');
    const activeSessionQuery = await sessionsRef
      .where('serverId', '==', id)
      .where('status', '==', 'active')
      .orderBy('startedAt', 'desc')
      .limit(1)
      .get();

    if (activeSessionQuery.empty) {
      return NextResponse.json({ session: null });
    }

    const sessionDoc = activeSessionQuery.docs[0];
    const sessionData = sessionDoc.data() as Omit<ServerSession, 'id'>;

    // Buscar créditos atuais
    let currentCredits = sessionData.creditsAtStart;
    try {
      const client = getExarotonClient();
      const account = await (client as any).getAccount();
      currentCredits = account.credits;
    } catch (error) {
      console.error('Error fetching current credits:', error);
    }

    const startedAt = sessionData.startedAt instanceof Date 
      ? sessionData.startedAt 
      : (sessionData.startedAt as any)?.toDate?.() || new Date(sessionData.startedAt as any);

    const now = new Date();
    const elapsedTime = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const creditsSpent = Math.max(0, sessionData.creditsAtStart - currentCredits);

    const activeSession: ActiveServerSession = {
      sessionId: sessionDoc.id,
      serverId: id,
      serverName: sessionData.serverName,
      startedAt,
      creditsAtStart: sessionData.creditsAtStart,
      currentCredits,
      creditsSpent,
      elapsedTime,
    };

    return NextResponse.json({ session: activeSession });
  } catch (error: any) {
    console.error('Error fetching server session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch server session' },
      { status: 500 }
    );
  }
}
