import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logAction } from '@/lib/action-logger';
import { ActionType } from '@/types';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { action } = body;

    if (!action || !['login', 'logout', 'register'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get user data from Firestore
    const userDoc = await adminDb().collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Get additional context from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;

    // Log the action
    await logAction({
      type: action as ActionType,
      userId,
      userName: userData?.displayName || userData?.name || decodedToken.name || decodedToken.email || 'Unknown',
      userEmail: userData?.email || decodedToken.email || '',
      userPhotoUrl: userData?.photoURL || decodedToken.picture,
      details: {
        ipAddress,
        userAgent,
      },
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging auth action:', error);
    const message = error instanceof Error ? error.message : 'Failed to log action';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
