import { NextRequest, NextResponse } from 'next/server';
import { startServer, getServer } from '@/lib/exaroton';
import { adminAuth, adminDb, invalidateServerCache } from '@/lib/firebase-admin';
import { logAction } from '@/lib/action-logger';

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
    try {
      const server = await getServer(id);
      serverName = server?.name || id;
    } catch {
      // Use ID if server name fetch fails
    }

    // Start the server
    await startServer(id);
    
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
    });
    
    return NextResponse.json({ success: true, message: 'Server starting' });
  } catch (error) {
    console.error('Error starting server:', error);
    const message = error instanceof Error ? error.message : 'Failed to start server';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
