import { NextRequest, NextResponse } from 'next/server';
import { restartServer } from '@/lib/exaroton';
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
    
    // Only admins can restart servers
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Restart the server
    await restartServer(id);
    
    return NextResponse.json({ success: true, message: 'Server restarting' });
  } catch (error) {
    console.error('Error restarting server:', error);
    const message = error instanceof Error ? error.message : 'Failed to restart server';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
