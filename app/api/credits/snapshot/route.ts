import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getExarotonClient, getServers } from '@/lib/exaroton';
import { CreditSnapshot, RunningServerSnapshot } from '@/types';

/**
 * GET /api/credits/snapshot
 * Retorna o snapshot mais recente de créditos
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    if (decodedToken.admin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get the most recent snapshot
    const snapshotsRef = adminDb().collection('creditSnapshots');
    const snapshot = await snapshotsRef
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ snapshot: null });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return NextResponse.json({
      snapshot: {
        id: doc.id,
        credits: data.credits,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        type: data.type,
        serverStates: data.serverStates || [],
      },
    });
  } catch (error: any) {
    console.error('Error fetching credit snapshot:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch credit snapshot' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/credits/snapshot
 * Cria um novo snapshot de créditos
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    if (decodedToken.admin !== true) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current account info
    const client = getExarotonClient();
    const account = await (client as any).getAccount();
    const currentCredits = account.credits;

    // Get body for snapshot type
    const body = await request.json().catch(() => ({}));
    const snapshotType = body.type || 'manual';

    // Get running servers
    const servers = await getServers();
    const serverStates: RunningServerSnapshot[] = [];

    for (const server of servers) {
      // Status 1 = online/running
      if (server.status === 1) {
        serverStates.push({
          serverId: server.id,
          serverName: server.name,
          ram: server.ram || 4, // Default 4GB if not specified
          status: server.status,
        });
      }
    }

    // Create snapshot document
    const snapshotData: Omit<CreditSnapshot, 'id'> = {
      credits: currentCredits,
      timestamp: new Date(),
      type: snapshotType,
      serverStates,
    };

    const docRef = await adminDb().collection('creditSnapshots').add({
      ...snapshotData,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      snapshot: {
        id: docRef.id,
        ...snapshotData,
      },
    });
  } catch (error: any) {
    console.error('Error creating credit snapshot:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create credit snapshot' },
      { status: 500 }
    );
  }
}
