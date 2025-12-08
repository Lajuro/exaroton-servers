import { NextRequest, NextResponse } from 'next/server';
import { startServer, getServer, getExarotonClient } from '@/lib/exaroton';
import { adminAuth, adminDb, invalidateServerCache } from '@/lib/firebase-admin';
import { logAction } from '@/lib/action-logger';
import { executeServerAutomation } from '@/lib/automation-executor';
import { FieldValue } from 'firebase-admin/firestore';
import { ServerSession } from '@/types';

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

    // Get server info for logging
    let serverName = id;
    let serverRam = 0;
    try {
      const server = await getServer(id);
      serverName = server?.name || id;
      serverRam = server?.ram || 0;
    } catch {
      // Use ID if server name fetch fails
    }

    // Get current credits before starting the server
    let creditsAtStart = 0;
    try {
      const client = getExarotonClient();
      const account = await (client as any).getAccount();
      creditsAtStart = account.credits;
    } catch (error) {
      console.error('Error fetching credits before start:', error);
    }

    // Start the server
    await startServer(id);
    
    // Create a new server session record
    const sessionData: Omit<ServerSession, 'id'> = {
      serverId: id,
      serverName,
      startedBy: {
        userId,
        userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
        userEmail: userData?.email || decodedToken.email || '',
      },
      startedAt: new Date(),
      creditsAtStart,
      status: 'active',
      serverRam,
    };

    // Save session to Firestore
    await adminDb().collection('serverSessions').add({
      ...sessionData,
      startedAt: FieldValue.serverTimestamp(),
    });
    
    // Invalidar cache do servidor
    await invalidateServerCache(id);
    
    // Log the action
    await logAction({
      type: 'server_start',
      userId,
      userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
      userEmail: userData?.email || decodedToken.email || '',
      userPhotoUrl: userData?.photoURL,
      serverId: id,
      serverName,
      success: true,
      details: {
        previousValue: `${creditsAtStart} credits`,
      },
    });

    // Execute start automation in background (non-blocking)
    // Note: This will execute immediately, but for commands that need
    // the server to be fully online, the automation should include delays
    executeServerAutomation(id, 'start', userId).catch(err => {
      console.error('[Automation] Error executing start automation:', err);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Server starting',
      creditsAtStart,
    });
  } catch (error) {
    console.error('Error starting server:', error);
    const message = error instanceof Error ? error.message : 'Failed to start server';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

