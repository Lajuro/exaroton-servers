import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';
import { CreditSnapshot, CreditReport, DailySpending, ServerUsageSummary } from '@/types';

/**
 * GET /api/credits/report
 * Retorna dados estruturados para geração de relatório
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Default to last 30 days if not specified
    const now = new Date();
    const endDate = endDateStr ? new Date(endDateStr) : now;
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get current credits
    const client = getExarotonClient();
    const account = await (client as any).getAccount();
    const currentCredits = account.credits;

    // Get snapshots for the period
    const snapshotsRef = adminDb().collection('creditSnapshots');
    const snapshotsQuery = await snapshotsRef
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .orderBy('timestamp', 'asc')
      .get();

    const snapshots: CreditSnapshot[] = snapshotsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        credits: data.credits,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        type: data.type,
        serverStates: data.serverStates || [],
      };
    });

    // Calculate start and end credits
    let startCredits = currentCredits;
    let endCredits = currentCredits;

    if (snapshots.length > 0) {
      startCredits = snapshots[0].credits;
      endCredits = currentCredits;
    }

    const totalSpent = Math.max(0, startCredits - endCredits);
    const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const hours = days * 24;
    const averagePerDay = totalSpent / days;
    const averagePerHour = totalSpent / hours;
    const projectedMonthly = averagePerDay * 30;

    // Calculate daily breakdown
    const dailyBreakdown: DailySpending[] = [];
    const dailySnapshots: { [key: string]: CreditSnapshot[] } = {};

    // Group snapshots by day
    snapshots.forEach(snapshot => {
      const dateKey = snapshot.timestamp.toISOString().split('T')[0];
      if (!dailySnapshots[dateKey]) {
        dailySnapshots[dateKey] = [];
      }
      dailySnapshots[dateKey].push(snapshot);
    });

    // Calculate daily spending
    const sortedDates = Object.keys(dailySnapshots).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      const dateKey = sortedDates[i];
      const daySnaps = dailySnapshots[dateKey];
      
      if (daySnaps.length > 0) {
        const dayStartCredits = daySnaps[0].credits;
        let dayEndCredits: number;
        
        if (dateKey === now.toISOString().split('T')[0]) {
          dayEndCredits = currentCredits;
        } else if (i < sortedDates.length - 1) {
          const nextDaySnaps = dailySnapshots[sortedDates[i + 1]];
          dayEndCredits = nextDaySnaps[0].credits;
        } else {
          dayEndCredits = daySnaps[daySnaps.length - 1].credits;
        }

        dailyBreakdown.push({
          date: new Date(dateKey),
          startCredits: dayStartCredits,
          endCredits: dayEndCredits,
          spent: Math.max(0, dayStartCredits - dayEndCredits),
        });
      }
    }

    // Calculate server usage summary
    const serverUsageMap: { [serverId: string]: ServerUsageSummary } = {};

    snapshots.forEach(snapshot => {
      if (snapshot.serverStates) {
        snapshot.serverStates.forEach(server => {
          if (!serverUsageMap[server.serverId]) {
            serverUsageMap[server.serverId] = {
              serverId: server.serverId,
              serverName: server.serverName,
              totalHoursRunning: 0,
              ramGB: server.ram,
              estimatedCreditsUsed: 0,
            };
          }
          // Estimate hours based on snapshot intervals (assume hourly snapshots)
          serverUsageMap[server.serverId].totalHoursRunning += 1;
          serverUsageMap[server.serverId].estimatedCreditsUsed += server.ram;
        });
      }
    });

    const serverUsage = Object.values(serverUsageMap);

    // Build report
    const report: CreditReport = {
      generatedAt: now,
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        startCredits,
        endCredits,
        totalSpent,
        averagePerDay,
        averagePerHour,
        projectedMonthly,
      },
      dailyBreakdown,
      serverUsage,
    };

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
