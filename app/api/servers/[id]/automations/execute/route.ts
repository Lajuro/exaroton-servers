import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { executeServerCommand } from '@/lib/exaroton';
import { AutomationSequence, AutomationAction, AutomationExecutionLog } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// POST - Executar uma sequência de automação
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

    // Verificar se usuário é admin
    const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isAdmin = userData?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { trigger, playerName } = body as { 
      trigger: 'start' | 'stop' | 'playerJoin' | 'playerLeave';
      playerName?: string;
    };

    if (!trigger || !['start', 'stop', 'playerJoin', 'playerLeave'].includes(trigger)) {
      return NextResponse.json({ error: 'Invalid trigger type' }, { status: 400 });
    }

    // Para triggers de player, playerName é obrigatório
    if ((trigger === 'playerJoin' || trigger === 'playerLeave') && !playerName) {
      return NextResponse.json({ error: 'playerName is required for player triggers' }, { status: 400 });
    }

    // Buscar automações do servidor
    const automationDoc = await adminDb()
      .collection('serverAutomations')
      .doc(serverId)
      .get();

    if (!automationDoc.exists) {
      return NextResponse.json({ error: 'No automation configured' }, { status: 404 });
    }

    const automationData = automationDoc.data();
    
    if (!automationData?.enabled) {
      return NextResponse.json({ message: 'Automation is disabled', executed: false });
    }

    // Determinar qual sequência executar
    const triggerMap: Record<string, string> = {
      start: 'onStart',
      stop: 'onStop',
      playerJoin: 'onPlayerJoin',
      playerLeave: 'onPlayerLeave',
    };

    const sequenceKey = triggerMap[trigger];
    const sequence = automationData[sequenceKey] as AutomationSequence | undefined;

    if (!sequence || !sequence.enabled || !sequence.actions?.length) {
      return NextResponse.json({ message: 'No sequence to execute', executed: false });
    }

    // Executar a sequência
    const startTime = Date.now();
    const result = await executeSequence(serverId, sequence, playerName);
    const duration = Date.now() - startTime;

    // Registrar log de execução
    const executionLog: Omit<AutomationExecutionLog, 'id'> = {
      serverId,
      sequenceId: sequence.id,
      sequenceName: sequence.name,
      trigger,
      executedAt: new Date(),
      executedBy: decodedToken.uid,
      success: result.errors.length === 0,
      actionsExecuted: result.executed,
      actionsFailed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
      duration,
    };

    await adminDb().collection('automationLogs').add({
      ...executionLog,
      executedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: result.errors.length === 0,
      executed: true,
      actionsExecuted: result.executed,
      actionsFailed: result.failed,
      errors: result.errors,
      duration,
    });
  } catch (error) {
    console.error('Error executing automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Função para executar uma sequência de ações
async function executeSequence(
  serverId: string,
  sequence: AutomationSequence,
  playerName?: string
): Promise<{ executed: number; failed: number; errors: string[] }> {
  const result = { executed: 0, failed: 0, errors: [] as string[] };
  
  // Ordenar ações pela ordem
  const sortedActions = [...sequence.actions]
    .filter(a => a.enabled)
    .sort((a, b) => a.order - b.order);

  for (const action of sortedActions) {
    try {
      await executeAction(serverId, action, playerName);
      result.executed++;
    } catch (error: any) {
      result.failed++;
      result.errors.push(`Action ${action.id} (${action.type}): ${error.message}`);
      console.error(`[Automation] Error executing action ${action.id}:`, error);
    }
  }

  return result;
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
      await executeTitle(serverId, 'title', config, target, playerName);
      break;

    case 'subtitle':
      await executeTitle(serverId, 'subtitle', config, target, playerName);
      break;

    case 'actionbar':
      await executeTitle(serverId, 'actionbar', config, target, playerName);
      break;

    case 'message':
      if (config.text) {
        const text = replacePlayerPlaceholder(config.text, playerName);
        const formattedText = formatMinecraftText(text, config);
        await executeServerCommand(serverId, `tellraw ${target} ${formattedText}`);
      }
      break;

    case 'delay':
      if (config.delaySeconds && config.delaySeconds > 0) {
        await sleep(config.delaySeconds * 1000);
      }
      break;

    case 'countdown':
      await executeCountdown(serverId, config, target, playerName);
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

    case 'time':
      if (config.timeValue !== undefined) {
        await executeServerCommand(serverId, `time set ${config.timeValue}`);
      }
      break;

    case 'weather':
      if (config.weatherType) {
        const duration = config.weatherDuration ? `${config.weatherDuration}` : '';
        await executeServerCommand(serverId, `weather ${config.weatherType} ${duration}`.trim());
      }
      break;

    default:
      console.warn(`[Automation] Unknown action type: ${type}`);
  }
}

// Executar comando de título
async function executeTitle(
  serverId: string,
  titleType: 'title' | 'subtitle' | 'actionbar',
  config: AutomationAction['config'],
  target: string,
  playerName?: string
): Promise<void> {
  if (!config.text) return;

  // Configurar timing se for título principal
  if (titleType === 'title' && (config.fadeIn || config.stay || config.fadeOut)) {
    const fadeIn = config.fadeIn ?? 10;
    const stay = config.stay ?? 70;
    const fadeOut = config.fadeOut ?? 20;
    await executeServerCommand(serverId, `title ${target} times ${fadeIn} ${stay} ${fadeOut}`);
  }

  const text = replacePlayerPlaceholder(config.text, playerName);
  const formattedText = formatMinecraftJson(text, config);
  await executeServerCommand(serverId, `title ${target} ${titleType} ${formattedText}`);
}

// Executar countdown
async function executeCountdown(
  serverId: string,
  config: AutomationAction['config'],
  target: string,
  playerName?: string
): Promise<void> {
  const countdownFrom = config.countdownFrom ?? 5;
  const interval = (config.countdownInterval ?? 1) * 1000;
  let message = config.countdownMessage ?? '{seconds}';
  message = replacePlayerPlaceholder(message, playerName);

  for (let i = countdownFrom; i >= 1; i--) {
    const text = message.replace(/{seconds}/g, i.toString());
    const formattedText = formatMinecraftJson(text, config);
    await executeServerCommand(serverId, `title ${target} title ${formattedText}`);
    
    // Tocar som de tick (opcional)
    await executeServerCommand(
      serverId,
      `playsound minecraft:block.note_block.pling master ${target} ~ ~ ~ 0.5 ${i === 1 ? 2 : 1}`
    );
    
    if (i > 1) {
      await sleep(interval);
    }
  }
}

// Formatar texto para JSON do Minecraft
function formatMinecraftJson(text: string, config: AutomationAction['config']): string {
  const jsonObj: Record<string, any> = { text };
  
  if (config.color) jsonObj.color = config.color;
  if (config.bold) jsonObj.bold = true;
  if (config.italic) jsonObj.italic = true;
  
  return JSON.stringify(jsonObj);
}

// Formatar texto para tellraw
function formatMinecraftText(text: string, config: AutomationAction['config']): string {
  return formatMinecraftJson(text, config);
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
