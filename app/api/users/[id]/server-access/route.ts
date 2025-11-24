import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serverAccess } = body;

    if (!Array.isArray(serverAccess)) {
      return NextResponse.json(
        { error: 'Invalid serverAccess value' },
        { status: 400 }
      );
    }
    
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
    
    // Only admins can change user server access
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update the target user's server access
    await adminDb().collection('users').doc(id).update({
      serverAccess,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Server access updated' });
  } catch (error) {
    console.error('Error updating server access:', error);
    const message = error instanceof Error ? error.message : 'Failed to update server access';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serverId, action } = body;

    if (!serverId || !['grant', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
    
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
    
    // Only admins can manage server access
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get target user's current server access
    const targetUserDoc = await adminDb().collection('users').doc(id).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();
    let serverAccess = targetUserData?.serverAccess || [];

    if (action === 'grant') {
      if (!serverAccess.includes(serverId)) {
        serverAccess.push(serverId);
      }
    } else if (action === 'revoke') {
      serverAccess = serverAccess.filter((s: string) => s !== serverId);
    }

    // Update the target user's server access
    await adminDb().collection('users').doc(id).update({
      serverAccess,
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      message: `Server access ${action === 'grant' ? 'granted' : 'revoked'}` 
    });
  } catch (error) {
    console.error('Error updating server access:', error);
    const message = error instanceof Error ? error.message : 'Failed to update server access';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
