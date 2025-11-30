import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';
import { CreditSnapshot, CreditSpending, DailySpending } from '@/types';

/**
 * GET /api/credits/history
 * Retorna o histórico de créditos com cálculos de gastos
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

    // Get current credits
    const client = getExarotonClient();
    const account = await (client as any).getAccount();
    const currentCredits = account.credits;

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);

    // Get snapshots from the last month
    const snapshotsRef = adminDb().collection('creditSnapshots');
    const snapshotsQuery = await snapshotsRef
      .where('timestamp', '>=', monthAgo)
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

    // Helper function to calculate spending for a period
    const calculateSpending = (
      startDate: Date,
      endDate: Date,
      period: CreditSpending['period']
    ): CreditSpending => {
      const periodSnapshots = snapshots.filter(
        s => s.timestamp >= startDate && s.timestamp <= endDate
      );

      if (periodSnapshots.length === 0) {
        return {
          period,
          startCredits: currentCredits,
          endCredits: currentCredits,
          spent: 0,
          startDate,
          endDate,
          averagePerDay: 0,
          averagePerHour: 0,
        };
      }

      const startCredits = periodSnapshots[0].credits;
      const endCredits = currentCredits;
      const spent = Math.max(0, startCredits - endCredits);
      const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const hours = days * 24;

      return {
        period,
        startCredits,
        endCredits,
        spent,
        startDate,
        endDate,
        averagePerDay: spent / days,
        averagePerHour: spent / hours,
      };
    };

    // Calculate spending for different periods
    const daySpending = calculateSpending(todayStart, now, 'day');
    const threeDaySpending = calculateSpending(threeDaysAgo, now, '3days');
    const weekSpending = calculateSpending(weekAgo, now, 'week');
    const monthSpending = calculateSpending(monthAgo, now, 'month');

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
        const startCredits = daySnaps[0].credits;
        let endCredits: number;
        
        // For today, use current credits; otherwise use last snapshot of the day
        if (dateKey === now.toISOString().split('T')[0]) {
          endCredits = currentCredits;
        } else if (i < sortedDates.length - 1) {
          // Use the first snapshot of the next day
          const nextDaySnaps = dailySnapshots[sortedDates[i + 1]];
          endCredits = nextDaySnaps[0].credits;
        } else {
          endCredits = daySnaps[daySnaps.length - 1].credits;
        }

        dailyBreakdown.push({
          date: new Date(dateKey),
          startCredits,
          endCredits,
          spent: Math.max(0, startCredits - endCredits),
        });
      }
    }

    return NextResponse.json({
      currentCredits,
      spending: {
        day: daySpending,
        threeDays: threeDaySpending,
        week: weekSpending,
        month: monthSpending,
      },
      dailyBreakdown: dailyBreakdown.slice(-7), // Last 7 days
      totalSnapshots: snapshots.length,
      lastSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1] : null,
    });
  } catch (error: any) {
    console.error('Error fetching credit history:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch credit history' },
      { status: 500 }
    );
  }
}
