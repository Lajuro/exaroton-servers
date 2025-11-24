import { NextRequest, NextResponse } from 'next/server';
import { getServers } from '@/lib/exaroton';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
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
    
    // Get all servers from Exaroton
    const allServers = await getServers();
    
    // Filter servers based on user access
    let servers = allServers;
    if (!userData?.isAdmin) {
      // If not admin, filter by serverAccess
      const serverAccess = userData?.serverAccess || [];
      servers = allServers.filter((server: { id: string }) => serverAccess.includes(server.id));
    }

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error fetching servers:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch servers';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
