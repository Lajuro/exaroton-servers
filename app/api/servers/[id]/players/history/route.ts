import { NextRequest, NextResponse } from 'next/server';
import { getServer } from '@/lib/exaroton';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { PlayerHistory, PlayerRankingEntry, PlayerSession } from '@/types';

/**
 * GET /api/servers/[id]/players/history
 * Retorna histórico e ranking de jogadores do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificar acesso
    const userDoc = await adminDb().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin && !userData?.serverAccess?.includes(id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Buscar dados do servidor e jogadores online
    const server = await getServer(id);
    const onlinePlayers = server.players?.list || [];

    // Buscar histórico de jogadores do Firestore
    const historyRef = adminDb().collection('playerHistory').doc(id);
    const historyDoc = await historyRef.get();
    
    let playerHistories: Record<string, PlayerHistory> = {};
    let lastOnlineAt: Date | null = null;
    
    if (historyDoc.exists) {
      const data = historyDoc.data();
      playerHistories = data?.players || {};
      lastOnlineAt = data?.lastOnlineAt?.toDate() || null;
    }

    // Atualizar status de jogadores online
    const now = new Date();
    const serverIsOnline = server.status === 1;

    if (serverIsOnline && onlinePlayers.length > 0) {
      // Atualizar lastOnlineAt
      lastOnlineAt = now;

      // Atualizar histórico de cada jogador online
      for (const playerName of onlinePlayers) {
        if (!playerHistories[playerName]) {
          playerHistories[playerName] = {
            id: playerName,
            serverId: id,
            playerName,
            totalPlaytime: 0,
            sessionCount: 0,
            firstSeen: now,
            lastSeen: now,
            recentSessions: [],
          };
        }

        const playerHistory = playerHistories[playerName];
        playerHistory.lastSeen = now;

        // Verificar se há uma sessão ativa (última sessão sem leftAt)
        const lastSession = playerHistory.recentSessions[playerHistory.recentSessions.length - 1];
        if (!lastSession || lastSession.leftAt) {
          // Criar nova sessão
          const newSession: PlayerSession = {
            id: `${playerName}-${now.getTime()}`,
            serverId: id,
            serverName: server.name,
            playerName,
            joinedAt: now,
          };
          playerHistory.recentSessions.push(newSession);
          playerHistory.sessionCount++;
        }
      }

      // Fechar sessões de jogadores que saíram
      for (const playerName of Object.keys(playerHistories)) {
        if (!onlinePlayers.includes(playerName)) {
          const playerHistory = playerHistories[playerName];
          const lastSession = playerHistory.recentSessions[playerHistory.recentSessions.length - 1];
          
          if (lastSession && !lastSession.leftAt) {
            lastSession.leftAt = now;
            lastSession.duration = Math.floor((now.getTime() - new Date(lastSession.joinedAt).getTime()) / 1000);
            playerHistory.totalPlaytime += lastSession.duration;
          }
        }
      }

      // Salvar alterações no Firestore
      await historyRef.set({
        players: playerHistories,
        lastOnlineAt: now,
        lastUpdated: now,
        serverId: id,
        serverName: server.name,
      }, { merge: true });
    } else if (!serverIsOnline) {
      // Servidor offline - fechar todas as sessões ativas
      let hasChanges = false;
      for (const playerName of Object.keys(playerHistories)) {
        const playerHistory = playerHistories[playerName];
        const lastSession = playerHistory.recentSessions[playerHistory.recentSessions.length - 1];
        
        if (lastSession && !lastSession.leftAt) {
          const leftAt = lastOnlineAt || now;
          lastSession.leftAt = leftAt;
          lastSession.duration = Math.floor((leftAt.getTime() - new Date(lastSession.joinedAt).getTime()) / 1000);
          playerHistory.totalPlaytime += lastSession.duration;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await historyRef.set({
          players: playerHistories,
          lastUpdated: now,
        }, { merge: true });
      }
    }

    // Calcular ranking
    const ranking: PlayerRankingEntry[] = Object.values(playerHistories)
      .map((p) => ({
        rank: 0,
        playerName: p.playerName,
        playerUuid: p.playerUuid,
        totalPlaytime: p.totalPlaytime,
        sessionCount: p.sessionCount,
        lastSeen: p.lastSeen,
        averageSessionDuration: p.sessionCount > 0 ? p.totalPlaytime / p.sessionCount : 0,
      }))
      .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
      .map((p, index) => ({ ...p, rank: index + 1 }))
      .slice(0, 50); // Top 50

    return NextResponse.json({
      serverId: id,
      serverName: server.name,
      serverStatus: server.status,
      onlinePlayers,
      lastOnlineAt,
      ranking,
      totalUniquePlayers: Object.keys(playerHistories).length,
    });
  } catch (error) {
    console.error('Error fetching player history:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch player history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
