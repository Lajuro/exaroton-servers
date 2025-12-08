import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';
import { CreditSnapshot, ActionLog } from '@/types';

/**
 * GET /api/stats
 * Retorna estatísticas agregadas para o dashboard de estatísticas
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

    // Verificar se usuário existe
    const db = adminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true;

    // Check for impersonation header (admin-only)
    const impersonateUserId = request.headers.get('X-Impersonate-User');
    let effectiveUserId = decodedToken.uid;
    let effectiveIsAdmin = isAdmin;
    let effectiveServerAccess = userData?.serverAccess || [];

    if (impersonateUserId && isAdmin) {
      // Admin is impersonating another user
      const impersonatedDoc = await db.collection('users').doc(impersonateUserId).get();
      if (impersonatedDoc.exists) {
        const impersonatedData = impersonatedDoc.data();
        effectiveUserId = impersonateUserId;
        effectiveIsAdmin = false; // Always treat as non-admin when impersonating
        effectiveServerAccess = impersonatedData?.serverAccess || [];
      }
    }

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get credit snapshots (últimos 30 dias)
    const snapshotsRef = db.collection('creditSnapshots');
    let snapshotsQuery;
    try {
      snapshotsQuery = await snapshotsRef
        .where('timestamp', '>=', thirtyDaysAgo)
        .orderBy('timestamp', 'asc')
        .get();
    } catch (queryError) {
      console.error('Error querying creditSnapshots:', queryError);
      snapshotsQuery = { docs: [] } as unknown as FirebaseFirestore.QuerySnapshot;
    }

    const snapshots: CreditSnapshot[] = snapshotsQuery.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        credits: data.credits,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        type: data.type,
        serverStates: data.serverStates || [],
      };
    });

    // Get current credits (apenas admin real, não impersonando)
    let currentCredits = 0;
    if (effectiveIsAdmin) {
      try {
        const client = getExarotonClient();
        const account = await (client as any).getAccount();
        currentCredits = account.credits;
      } catch (error) {
        console.error('Error fetching current credits:', error);
      }
    }

    // Calculate credits chart data (últimos 30 dias, agrupado por dia)
    const creditsChartData: { date: string; credits: number; spent: number }[] = [];
    const dailyCredits: { [key: string]: number[] } = {};

    snapshots.forEach(snapshot => {
      const dateKey = snapshot.timestamp.toISOString().split('T')[0];
      if (!dailyCredits[dateKey]) {
        dailyCredits[dateKey] = [];
      }
      dailyCredits[dateKey].push(snapshot.credits);
    });

    const sortedDates = Object.keys(dailyCredits).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      const dateKey = sortedDates[i];
      const dayCredits = dailyCredits[dateKey];
      const avgCredits = dayCredits.reduce((a, b) => a + b, 0) / dayCredits.length;
      
      let spent = 0;
      if (i > 0) {
        const prevDateKey = sortedDates[i - 1];
        const prevDayCredits = dailyCredits[prevDateKey];
        const prevAvg = prevDayCredits.reduce((a, b) => a + b, 0) / prevDayCredits.length;
        spent = Math.max(0, prevAvg - avgCredits);
      }

      creditsChartData.push({
        date: dateKey,
        credits: Math.round(avgCredits * 100) / 100,
        spent: Math.round(spent * 100) / 100,
      });
    }

    // Get action logs (últimos 30 dias)
    const actionsRef = db.collection('actionLogs');
    let actionsQuery;
    
    try {
      if (effectiveIsAdmin) {
        actionsQuery = await actionsRef
          .where('timestamp', '>=', thirtyDaysAgo)
          .orderBy('timestamp', 'desc')
          .get();
      } else {
        actionsQuery = await actionsRef
          .where('userId', '==', effectiveUserId)
          .where('timestamp', '>=', thirtyDaysAgo)
          .orderBy('timestamp', 'desc')
          .get();
      }
    } catch (queryError) {
      console.error('Error querying actionLogs:', queryError);
      // Return empty actions if query fails (e.g., missing index)
      actionsQuery = { docs: [] } as unknown as FirebaseFirestore.QuerySnapshot;
    }

    const actions: ActionLog[] = actionsQuery.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhotoUrl: data.userPhotoUrl,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        serverId: data.serverId,
        serverName: data.serverName,
        targetUserId: data.targetUserId,
        targetUserName: data.targetUserName,
        details: data.details,
        success: data.success,
        errorMessage: data.errorMessage,
      };
    });

    // Calculate action stats
    const actionStats = {
      totalActions: actions.length,
      serverStarts: actions.filter(a => a.type === 'server_start' && a.success).length,
      serverStops: actions.filter(a => a.type === 'server_stop' && a.success).length,
      serverRestarts: actions.filter(a => a.type === 'server_restart' && a.success).length,
      commands: actions.filter(a => a.type === 'server_command').length,
      failedActions: actions.filter(a => !a.success).length,
    };

    // Calculate actions by day
    const actionsByDay: { date: string; starts: number; stops: number; restarts: number; commands: number }[] = [];
    const dailyActions: { [key: string]: ActionLog[] } = {};

    actions.forEach(action => {
      const dateKey = action.timestamp.toISOString().split('T')[0];
      if (!dailyActions[dateKey]) {
        dailyActions[dateKey] = [];
      }
      dailyActions[dateKey].push(action);
    });

    Object.keys(dailyActions).sort().forEach(dateKey => {
      const dayActions = dailyActions[dateKey];
      actionsByDay.push({
        date: dateKey,
        starts: dayActions.filter(a => a.type === 'server_start' && a.success).length,
        stops: dayActions.filter(a => a.type === 'server_stop' && a.success).length,
        restarts: dayActions.filter(a => a.type === 'server_restart' && a.success).length,
        commands: dayActions.filter(a => a.type === 'server_command').length,
      });
    });

    // Calculate server usage from snapshots (servidores mais usados)
    const serverUsage: { [key: string]: { name: string; count: number; totalRam: number } } = {};
    
    snapshots.forEach(snapshot => {
      if (snapshot.serverStates) {
        snapshot.serverStates.forEach(server => {
          if (!serverUsage[server.serverId]) {
            serverUsage[server.serverId] = {
              name: server.serverName,
              count: 0,
              totalRam: 0,
            };
          }
          serverUsage[server.serverId].count++;
          serverUsage[server.serverId].totalRam += server.ram || 0;
        });
      }
    });

    const serverUsageArray = Object.entries(serverUsage)
      .map(([serverId, data]) => ({
        serverId,
        serverName: data.name,
        hoursOnline: Math.round((data.count / 4) * 10) / 10, // Assumindo snapshots a cada 15 min
        avgRam: data.count > 0 ? Math.round((data.totalRam / data.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.hoursOnline - a.hoursOnline);

    // Calculate peak usage hours
    const hourlyUsage: number[] = new Array(24).fill(0);
    actions.filter(a => a.type === 'server_start' && a.success).forEach(action => {
      const hour = action.timestamp.getHours();
      hourlyUsage[hour]++;
    });

    const peakHours = hourlyUsage
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculate user activity (apenas admin real)
    let userActivity: { userId: string; userName: string; photoUrl?: string; actionCount: number }[] = [];
    if (effectiveIsAdmin) {
      const userActions: { [key: string]: { name: string; photoUrl?: string; count: number } } = {};
      actions.forEach(action => {
        if (!userActions[action.userId]) {
          userActions[action.userId] = {
            name: action.userName,
            photoUrl: action.userPhotoUrl,
            count: 0,
          };
        }
        userActions[action.userId].count++;
      });

      userActivity = Object.entries(userActions)
        .map(([userId, data]) => ({
          userId,
          userName: data.name,
          photoUrl: data.photoUrl,
          actionCount: data.count,
        }))
        .sort((a, b) => b.actionCount - a.actionCount)
        .slice(0, 10);
    }

    // Calculate credits summary
    const creditsSummary = {
      current: currentCredits,
      thirtyDaysAgo: snapshots.length > 0 ? snapshots[0].credits : currentCredits,
      spent30Days: snapshots.length > 0 ? Math.max(0, snapshots[0].credits - currentCredits) : 0,
      avgPerDay: 0,
      projectedMonthly: 0,
    };

    if (creditsSummary.spent30Days > 0 && sortedDates.length > 1) {
      const days = sortedDates.length;
      creditsSummary.avgPerDay = Math.round((creditsSummary.spent30Days / days) * 100) / 100;
      creditsSummary.projectedMonthly = Math.round(creditsSummary.avgPerDay * 30 * 100) / 100;
    }

    return NextResponse.json({
      isAdmin: effectiveIsAdmin,
      credits: {
        summary: creditsSummary,
        chartData: creditsChartData,
      },
      actions: {
        stats: actionStats,
        byDay: actionsByDay,
        peakHours,
      },
      servers: {
        usage: serverUsageArray,
      },
      users: {
        activity: userActivity,
      },
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
