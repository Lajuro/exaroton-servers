import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logAction } from '@/lib/action-logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isAdmin: newIsAdmin } = body;

    if (typeof newIsAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isAdmin value' },
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
    
    // Only admins can change user roles
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get target user data for logging
    const targetUserDoc = await adminDb().collection('users').doc(id).get();
    const targetUserData = targetUserDoc.exists ? targetUserDoc.data() : null;
    const previousRole = targetUserData?.isAdmin ? 'admin' : 'user';
    const newRole = newIsAdmin ? 'admin' : 'user';

    // Update the target user's role
    await adminDb().collection('users').doc(id).update({
      isAdmin: newIsAdmin,
      updatedAt: new Date(),
    });

    // Log the action
    await logAction({
      type: 'user_role_change',
      userId,
      userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
      userEmail: userData?.email || decodedToken.email || '',
      userPhotoUrl: userData?.photoURL,
      targetUserId: id,
      targetUserName: targetUserData?.displayName || targetUserData?.name || targetUserData?.email || 'Unknown',
      details: {
        previousRole,
        newRole,
      },
      success: true,
    });

    return NextResponse.json({ success: true, message: 'User role updated' });
  } catch (error) {
    console.error('Error updating user role:', error);
    const message = error instanceof Error ? error.message : 'Failed to update user role';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
