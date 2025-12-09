import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { executeServerCommand, getExarotonClient } from '@/lib/exaroton';
import { AutomationSequence, AutomationAction } from '@/types';

// Verificar segredo do cron
const CRON_SECRET = process.env.CRON_SECRET_KEY;

// Interface para o cache de jogadores
interface PlayerCacheEntry {
  serverId: string;
  players: string[];
  lastChecked: Date;
}

// Função auxiliar para substituir {player} pelo nome do jogador
function replacePlayerPlaceholder(text: string, playerName?: string): string {
  if (!playerName) return text;
  return text.replace(/\{player\}/g, playerName);
}

// Função para executar uma ação individual
async function executeAction(serverId: string, action: AutomationAction, playerName?: string): Promise<void> {
  const { type, config } = action;
  
  // Substituir {player} pelo nome do jogador no target
  let target = config.targetSelector || '@a';
  if (target === '{player}' && playerName) {
    target = playerName;
  }

  switch (type) {
    case 'command':
      if (config.command) {
        let cmd = config.command.trim();
        if (cmd.startsWith('/')) cmd = cmd.slice(1);
        cmd = replacePlayerPlaceholder(cmd, playerName);
        await executeServerCommand(serverId, cmd);
      }
      break;

    case 'title':
    case 'subtitle':
    case 'actionbar':
      if (config.text) {
        const text = replacePlayerPlaceholder(config.text, playerName);
        const formattedText = formatMinecraftJson(text, config);
        
        if (type === 'title' && (config.fadeIn || config.stay || config.fadeOut)) {
          const fadeIn = config.fadeIn ?? 10;
          const stay = config.stay ?? 70;
          const fadeOut = config.fadeOut ?? 20;
          await executeServerCommand(serverId, `title ${target} times ${fadeIn} ${stay} ${fadeOut}`);
        }
        
        await executeServerCommand(serverId, `title ${target} ${type} ${formattedText}`);
      }
      break;

    case 'message':
      if (config.text) {
        const text = replacePlayerPlaceholder(config.text, playerName);
        const formattedText = formatMinecraftJson(text, config);
        await executeServerCommand(serverId, `tellraw ${target} ${formattedText}`);
      }
      break;

    case 'delay':
      if (config.delaySeconds && config.delaySeconds > 0) {
        await sleep(config.delaySeconds * 1000);
      }
      break;

    case 'sound':
      if (config.soundName) {
        const volume = config.volume ?? 1;
        const pitch = config.pitch ?? 1;
        await executeServerCommand(
          serverId,
          `playsound ${config.soundName} master ${target} ~ ~ ~ ${volume} ${pitch}`
        );
      }
      break;

    case 'effect':
      if (config.effectName) {
        const duration = config.duration ?? 30;
        const amplifier = config.amplifier ?? 0;
        await executeServerCommand(
          serverId,
          `effect give ${target} ${config.effectName} ${duration} ${amplifier}`
        );
      }
      break;

    default:
      console.log(`[PlayerMonitor] Skipping unsupported action type: ${type}`);
  }
}

// Formatar texto para JSON do Minecraft
function formatMinecraftJson(text: string, config: AutomationAction['config']): string {
  const jsonObj: Record<string, unknown> = { text };
  
  if (config.color) jsonObj.color = config.color;
  if (config.bold) jsonObj.bold = true;
  if (config.italic) jsonObj.italic = true;
  
  return JSON.stringify(jsonObj);
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar sequência de automação
async function executeSequence(
  serverId: string,
  sequence: AutomationSequence,
  playerName: string
): Promise<{ executed: number; failed: number }> {
  const result = { executed: 0, failed: 0 };
  
  const sortedActions = [...sequence.actions]
    .filter(a => a.enabled)
    .sort((a, b) => a.order - b.order);

  for (const action of sortedActions) {
    try {
      await executeAction(serverId, action, playerName);
      result.executed++;
    } catch (error) {
      result.failed++;
      console.error(`[PlayerMonitor] Error executing action:`, error);
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do cron
    const authHeader = request.headers.get('Authorization');
    const apiKey = request.headers.get('X-API-Key');
    
    // Suportar Vercel Cron (Authorization: Bearer) ou API Key manual
    const isVercelCron = authHeader === `Bearer ${CRON_SECRET}`;
    const isApiKey = apiKey === CRON_SECRET;
    
    if (!CRON_SECRET || (!isVercelCron && !isApiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PlayerMonitor] Starting player monitoring cycle...');
    
    // Buscar todos os servidores com automações ativas
    const automationsSnapshot = await adminDb()
      .collection('serverAutomations')
      .where('enabled', '==', true)
      .get();

    if (automationsSnapshot.empty) {
      return NextResponse.json({ message: 'No active automations', processed: 0 });
    }

    const client = getExarotonClient();
    const results: Array<{
      serverId: string;
      serverName: string;
      playersJoined: string[];
      playersLeft: string[];
      automationsExecuted: number;
    }> = [];

    for (const doc of automationsSnapshot.docs) {
      const serverId = doc.id;
      const automationData = doc.data();
      
      // Verificar se tem automações de player configuradas
      const hasPlayerJoin = automationData.onPlayerJoin?.enabled && 
                           automationData.onPlayerJoin?.actions?.length > 0;
      const hasPlayerLeave = automationData.onPlayerLeave?.enabled && 
                            automationData.onPlayerLeave?.actions?.length > 0;
      
      if (!hasPlayerJoin && !hasPlayerLeave) {
        continue;
      }

      try {
        // Buscar dados atuais do servidor
        const server = client.server(serverId);
        await server.get();
        
        // Só processar se o servidor estiver online
        if (server.status !== 1) {
          continue;
        }

        const currentPlayers: string[] = server.players?.list || [];
        
        // Buscar cache anterior de jogadores e jogadores que já receberam saudação
        const cacheRef = adminDb().collection('playerCache').doc(serverId);
        const cacheDoc = await cacheRef.get();
        const cacheData = cacheDoc.exists ? cacheDoc.data() : null;
        const previousPlayers: string[] = cacheData?.players || [];
        const greetedPlayers: string[] = cacheData?.greetedPlayers || [];
        const lastServerStatus: number = cacheData?.lastServerStatus ?? 0;
        
        // Se o servidor acabou de ligar (estava offline), limpar lista de saudados
        let currentGreetedPlayers = [...greetedPlayers];
        if (lastServerStatus !== 1 && server.status === 1) {
          console.log(`[PlayerMonitor] Server ${server.name} just started, clearing greeted players list`);
          currentGreetedPlayers = [];
        }
        
        // Detectar jogadores que entraram (novos em relação ao cache anterior)
        const playersJoined = currentPlayers.filter((p: string) => !previousPlayers.includes(p));
        
        // Detectar jogadores que saíram
        const playersLeft = previousPlayers.filter((p: string) => !currentPlayers.includes(p));
        
        // Detectar jogadores online que ainda NÃO receberam saudação
        const playersNeedingGreeting = currentPlayers.filter((p: string) => !currentGreetedPlayers.includes(p));
        
        let automationsExecuted = 0;
        const newlyGreetedPlayers: string[] = [];
        
        // Executar automações de player join para TODOS que precisam de saudação
        // (não apenas os que acabaram de entrar, mas qualquer um que ainda não foi saudado)
        if (hasPlayerJoin && playersNeedingGreeting.length > 0) {
          for (const player of playersNeedingGreeting) {
            console.log(`[PlayerMonitor] Greeting player: ${player} on ${server.name}`);
            const result = await executeSequence(
              serverId,
              automationData.onPlayerJoin,
              player
            );
            automationsExecuted += result.executed;
            newlyGreetedPlayers.push(player);
          }
        }
        
        // Executar automações de player leave
        if (hasPlayerLeave && playersLeft.length > 0) {
          for (const player of playersLeft) {
            console.log(`[PlayerMonitor] Player left: ${player} on ${server.name}`);
            const result = await executeSequence(
              serverId,
              automationData.onPlayerLeave,
              player
            );
            automationsExecuted += result.executed;
          }
        }
        
        // Atualizar lista de jogadores saudados
        // Adicionar os recém-saudados e remover os que saíram
        const updatedGreetedPlayers = [
          ...currentGreetedPlayers.filter((p: string) => currentPlayers.includes(p)), // Manter apenas os que ainda estão online
          ...newlyGreetedPlayers
        ];
        
        // Atualizar cache
        await cacheRef.set({
          serverId,
          players: currentPlayers,
          greetedPlayers: updatedGreetedPlayers,
          lastServerStatus: server.status,
          lastChecked: new Date(),
        });
        
        if (playersNeedingGreeting.length > 0 || playersLeft.length > 0) {
          results.push({
            serverId,
            serverName: server.name,
            playersJoined: playersNeedingGreeting, // Reportar quem foi saudado
            playersLeft,
            automationsExecuted,
          });
        }
        
      } catch (error) {
        console.error(`[PlayerMonitor] Error processing server ${serverId}:`, error);
      }
    }

    console.log(`[PlayerMonitor] Cycle complete. Processed ${results.length} server events.`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      serversWithEvents: results.length,
      results,
    });
    
  } catch (error) {
    console.error('[PlayerMonitor] Error in cron job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
