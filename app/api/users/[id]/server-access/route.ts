import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logAction } from '@/lib/action-logger';
import { getServers } from '@/lib/exaroton';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serverAccess: newServerAccess } = body;

    if (!Array.isArray(newServerAccess)) {
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

    // Get target user data for logging
    const targetUserDoc = await adminDb().collection('users').doc(id).get();
    const targetUserData = targetUserDoc.exists ? targetUserDoc.data() : null;
    const previousServerAccess = targetUserData?.serverAccess || [];

    // Update the target user's server access
    await adminDb().collection('users').doc(id).update({
      serverAccess: newServerAccess,
      updatedAt: new Date(),
    });

    // Determine which servers were granted or revoked
    const granted = newServerAccess.filter((s: string) => !previousServerAccess.includes(s));
    const revoked = previousServerAccess.filter((s: string) => !newServerAccess.includes(s));

    // Get server names for logging
    let serverNames: Record<string, string> = {};
    try {
      const servers = await getServers();
      serverNames = servers.reduce((acc: Record<string, string>, s: any) => {
        acc[s.id] = s.name;
        return acc;
      }, {});
    } catch {
      // Continue without server names
    }

    // Log grant actions
    for (const serverId of granted) {
      await logAction({
        type: 'user_access_grant',
        userId,
        userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
        userEmail: userData?.email || decodedToken.email || '',
        userPhotoUrl: userData?.photoURL,
        targetUserId: id,
        targetUserName: targetUserData?.displayName || targetUserData?.name || targetUserData?.email || 'Unknown',
        serverId,
        serverName: serverNames[serverId] || serverId,
        success: true,
      });
    }

    // Log revoke actions
    for (const serverId of revoked) {
      await logAction({
        type: 'user_access_revoke',
        userId,
        userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
        userEmail: userData?.email || decodedToken.email || '',
        userPhotoUrl: userData?.photoURL,
        targetUserId: id,
        targetUserName: targetUserData?.displayName || targetUserData?.name || targetUserData?.email || 'Unknown',
        serverId,
        serverName: serverNames[serverId] || serverId,
        success: true,
      });
    }

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

    // Get server name for logging
    let serverName = serverId;
    try {
      const servers = await getServers();
      const server = servers.find((s: any) => s.id === serverId);
      serverName = server?.name || serverId;
    } catch {
      // Continue with ID
    }

    // Log the action
    await logAction({
      type: action === 'grant' ? 'user_access_grant' : 'user_access_revoke',
      userId,
      userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
      userEmail: userData?.email || decodedToken.email || '',
      userPhotoUrl: userData?.photoURL,
      targetUserId: id,
      targetUserName: targetUserData?.displayName || targetUserData?.name || targetUserData?.email || 'Unknown',
      serverId,
      serverName,
      success: true,
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
