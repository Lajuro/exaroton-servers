import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getExarotonClient, getServers } from '@/lib/exaroton';
import { RunningServerSnapshot } from '@/types';

/**
 * POST /api/credits/auto-snapshot
 * Cria um snapshot automático de créditos
 * Pode ser chamado via CRON job ou similar
 * Requer API key secreta no header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify secret API key for automated calls
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = process.env.CRON_SECRET_KEY;

    // If no secret is configured, allow authenticated admin calls
    if (expectedKey && apiKey !== expectedKey) {
      // Try to verify as admin user
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get current account info
    const client = getExarotonClient();
    const account = await (client as any).getAccount();
    const currentCredits = account.credits;

    // Determine snapshot type based on time of day
    const now = new Date();
    const hour = now.getHours();
    let snapshotType: 'start_of_day' | 'end_of_day' | 'hourly';

    if (hour === 0) {
      snapshotType = 'start_of_day';
    } else if (hour === 23) {
      snapshotType = 'end_of_day';
    } else {
      snapshotType = 'hourly';
    }

    // Get running servers
    const servers = await getServers();
    const serverStates: RunningServerSnapshot[] = [];

    for (const server of servers) {
      // Status 1 = online/running
      if (server.status === 1) {
        serverStates.push({
          serverId: server.id,
          serverName: server.name,
          ram: server.ram || 4,
          status: server.status,
        });
      }
    }

    // Check if we already have a snapshot of this type today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const existingSnapshot = await adminDb()
      .collection('creditSnapshots')
      .where('timestamp', '>=', todayStart)
      .where('type', '==', snapshotType)
      .limit(1)
      .get();

    // For start/end of day, don't create duplicate
    if (!existingSnapshot.empty && snapshotType !== 'hourly') {
      return NextResponse.json({
        success: false,
        message: `Snapshot of type ${snapshotType} already exists for today`,
        existingId: existingSnapshot.docs[0].id,
      });
    }

    // Create snapshot document
    const snapshotData = {
      credits: currentCredits,
      timestamp: now,
      type: snapshotType,
      serverStates,
      runningServersCount: serverStates.length,
      totalRamInUse: serverStates.reduce((sum, s) => sum + s.ram, 0),
    };

    const docRef = await adminDb().collection('creditSnapshots').add(snapshotData);

    // Clean up old hourly snapshots (keep only last 48 hours)
    if (snapshotType === 'hourly') {
      const cutoffDate = new Date(now);
      cutoffDate.setHours(cutoffDate.getHours() - 48);

      const oldSnapshots = await adminDb()
        .collection('creditSnapshots')
        .where('type', '==', 'hourly')
        .where('timestamp', '<', cutoffDate)
        .get();

      const batch = adminDb().batch();
      oldSnapshots.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      snapshot: {
        id: docRef.id,
        ...snapshotData,
      },
      cleanedUp: snapshotType === 'hourly' ? 'old hourly snapshots' : null,
    });
  } catch (error: any) {
    console.error('Error creating auto snapshot:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create auto snapshot' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/credits/auto-snapshot
 * Retorna informações sobre os últimos snapshots automáticos
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = process.env.CRON_SECRET_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get the last snapshot of each type
    const types = ['start_of_day', 'end_of_day', 'hourly'] as const;
    const lastSnapshots: Record<string, any> = {};

    for (const type of types) {
      const snapshot = await adminDb()
        .collection('creditSnapshots')
        .where('type', '==', type)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        lastSnapshots[type] = {
          id: doc.id,
          credits: data.credits,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
          runningServersCount: data.runningServersCount || 0,
        };
      }
    }

    // Get total count of snapshots
    const totalCount = await adminDb()
      .collection('creditSnapshots')
      .count()
      .get();

    return NextResponse.json({
      lastSnapshots,
      totalSnapshotsCount: totalCount.data().count,
    });
  } catch (error: any) {
    console.error('Error fetching auto snapshot info:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch auto snapshot info' },
      { status: 500 }
    );
  }
}
