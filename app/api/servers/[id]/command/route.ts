import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { executeServerCommand, getServer } from '@/lib/exaroton';
import { logAction } from '@/lib/action-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data from Firestore for logging
    const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Check if user is admin
    const isAdmin = userData?.isAdmin === true || decodedToken.admin === true;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    let { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Trim whitespace and remove leading slash if present
    // Minecraft console commands should not have the leading /
    command = command.trim();
    if (command.startsWith('/')) {
      command = command.slice(1);
    }

    // Validate command is not empty after processing
    if (!command) {
      return NextResponse.json({ error: 'Command cannot be empty' }, { status: 400 });
    }

    // Get server name for logging
    let serverName = serverId;
    try {
      const server = await getServer(serverId);
      serverName = server?.name || serverId;
    } catch {
      // Use ID if server name fetch fails
    }

    try {
      console.log(`[Command] Executing command on server ${serverId}: "${command}"`);
      
      await executeServerCommand(serverId, command);
      
      console.log(`[Command] Command executed successfully`);
      
      // Log the action
      await logAction({
        type: 'server_command',
        userId: decodedToken.uid,
        userName: userData?.displayName || userData?.name || userData?.email || decodedToken.email || 'Unknown',
        userEmail: userData?.email || decodedToken.email || '',
        userPhotoUrl: userData?.photoURL,
        serverId,
        serverName,
        details: {
          command,
        },
        success: true,
      });
      
      return NextResponse.json({ success: true, message: 'Command executed successfully' });
    } catch (error: any) {
      console.error('[Command] Error executing command:', error);
      console.error('[Command] Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        response: error?.response?.data,
      });
      
      // Log failed action
      await logAction({
        type: 'server_command',
        userId: decodedToken.uid,
        userName: userData?.displayName || userData?.name || userData?.email || decodedToken.email || 'Unknown',
        userEmail: userData?.email || decodedToken.email || '',
        userPhotoUrl: userData?.photoURL,
        serverId,
        serverName,
        details: {
          command,
        },
        success: false,
        errorMessage: error?.message || 'Failed to execute command',
      });
      
      return NextResponse.json(
        { error: error?.message || 'Failed to execute command' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in command route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
