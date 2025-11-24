import { NextRequest, NextResponse } from 'next/server';
import { getExarotonClient } from '@/lib/exaroton';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(
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
    
    try {
      await adminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = getExarotonClient();
    const server = (client as any).server(serverId);
    await server.get();

    // Get additional server details
    let ram = null;
    let motd = null;

    try {
      ram = await server.getRAM();
    } catch (e) {
      console.log('Could not get RAM:', e);
    }

    try {
      motd = await server.getMOTD();
    } catch (e) {
      console.log('Could not get MOTD:', e);
    }

    return NextResponse.json({
      id: server.id,
      name: server.name,
      address: server.address,
      status: server.status,
      host: server.host,
      port: server.port,
      software: server.software,
      players: server.players,
      ram,
      motd,
    });
  } catch (error: any) {
    console.error('Error fetching server details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch server details' },
      { status: 500 }
    );
  }
}
