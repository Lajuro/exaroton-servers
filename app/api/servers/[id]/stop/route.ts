import { NextRequest, NextResponse } from 'next/server';
import { stopServer, getServerPlayers, getServer, getExarotonClient } from '@/lib/exaroton';
import { adminAuth, adminDb, invalidateServerCache } from '@/lib/firebase-admin';
import { logAction } from '@/lib/action-logger';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authorization token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await adminDb().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // Check if user has access to this server
    if (!userData?.isAdmin && !userData?.serverAccess?.includes(id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For non-admin users, check if server has players
    if (!userData?.isAdmin) {
      const players = await getServerPlayers(id);
      if (players && players.length > 0) {
        return NextResponse.json(
          { error: 'Cannot stop server: players are online' },
          { status: 403 }
        );
      }
    }

    // Get server info for logging
    let serverName = id;
    try {
      const server = await getServer(id);
      serverName = server?.name || id;
    } catch {
      // Use ID if server name fetch fails
    }

    // Stop the server FIRST - this is the main action
    await stopServer(id);
    
    // Invalidar cache do servidor
    await invalidateServerCache(id);

    // Get current credits after stopping the server
    let creditsAtEnd = 0;
    try {
      const client = getExarotonClient();
      const account = await (client as any).getAccount();
      creditsAtEnd = account.credits;
    } catch (error) {
      console.error('Error fetching credits after stop:', error);
    }

    // Find and complete the active session (non-blocking)
    let sessionDetails: {
      creditsAtStart: number;
      creditsSpent: number;
      duration: string;
    } | null = null;

    try {
      const sessionsRef = adminDb().collection('serverSessions');
      const activeSessionQuery = await sessionsRef
        .where('serverId', '==', id)
        .where('status', '==', 'active')
        .orderBy('startedAt', 'desc')
        .limit(1)
        .get();

      if (!activeSessionQuery.empty) {
        const sessionDoc = activeSessionQuery.docs[0];
        const sessionData = sessionDoc.data();
        const creditsAtStart = sessionData.creditsAtStart || 0;
        const creditsSpent = Math.max(0, creditsAtStart - creditsAtEnd);
        
        const startedAt = sessionData.startedAt?.toDate?.() || new Date(sessionData.startedAt);
        const stoppedAt = new Date();
        const durationMs = stoppedAt.getTime() - startedAt.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationHours = Math.floor(durationMinutes / 60);
        const remainingMinutes = durationMinutes % 60;
        const duration = durationHours > 0 
          ? `${durationHours}h ${remainingMinutes}m`
          : `${durationMinutes}m`;

        // Update the session with end data
        await sessionDoc.ref.update({
          stoppedBy: {
            userId,
            userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
            userEmail: userData?.email || decodedToken.email || '',
          },
          stoppedAt: FieldValue.serverTimestamp(),
          creditsAtEnd,
          creditsSpent,
          status: 'completed',
        });

        sessionDetails = {
          creditsAtStart,
          creditsSpent,
          duration,
        };
      }
    } catch (sessionError) {
      // Log but don't fail - session tracking is secondary to stopping the server
      console.error('Error updating session (non-critical):', sessionError);
    }
    
    // Log the action with credit details (non-blocking)
    try {
      await logAction({
        type: 'server_stop',
        userId,
        userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
        userEmail: userData?.email || decodedToken.email || '',
        userPhotoUrl: userData?.photoURL,
        serverId: id,
        serverName,
        success: true,
        details: sessionDetails ? {
          previousValue: `${sessionDetails.creditsAtStart} credits`,
          newValue: `${creditsAtEnd} credits (spent: ${sessionDetails.creditsSpent.toFixed(2)}, duration: ${sessionDetails.duration})`,
        } : undefined,
      });
    } catch (logError) {
      console.error('Error logging action (non-critical):', logError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Server stopping',
      creditsAtEnd,
      sessionDetails,
    });
  } catch (error) {
    console.error('Error stopping server:', error);
    const message = error instanceof Error ? error.message : 'Failed to stop server';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

