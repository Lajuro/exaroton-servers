import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayers } from '@/lib/exaroton';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(
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

    const players = await getServerPlayers(id);
    
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error fetching players:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch players';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
