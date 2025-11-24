import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';

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

    // Check if user is admin
    const isAdmin = decodedToken.admin === true;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    const client = getExarotonClient();
    const server = (client as any).server(serverId);

    try {
      await server.executeCommand(command);
      return NextResponse.json({ success: true, message: 'Command executed successfully' });
    } catch (error: any) {
      console.error('Error executing command:', error);
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
