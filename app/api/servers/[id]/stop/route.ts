import { NextRequest, NextResponse } from 'next/server';
import { stopServer, getServerPlayers } from '@/lib/exaroton';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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

    // Stop the server
    await stopServer(id);
    
    return NextResponse.json({ success: true, message: 'Server stopping' });
  } catch (error) {
    console.error('Error stopping server:', error);
    const message = error instanceof Error ? error.message : 'Failed to stop server';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
