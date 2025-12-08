import { adminDb } from '@/lib/firebase-admin';
import { executeServerCommand } from '@/lib/exaroton';
import { AutomationSequence, AutomationAction, AutomationExecutionLog, ServerAutomation } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Execute automation sequence for a server
 * This is called after server start or before server stop
 */
export async function executeServerAutomation(
  serverId: string,
  trigger: 'start' | 'stop',
  executedBy: string
): Promise<{ executed: boolean; success: boolean; error?: string }> {
  try {
    // Fetch automation config
    const automationDoc = await adminDb()
      .collection('serverAutomations')
      .doc(serverId)
      .get();

    if (!automationDoc.exists) {
      return { executed: false, success: true };
    }

    const automationData = automationDoc.data() as ServerAutomation;
    
    if (!automationData?.enabled) {
      return { executed: false, success: true };
    }

    // Get the appropriate sequence
    const sequence = trigger === 'start' ? automationData.onStart : automationData.onStop;

    if (!sequence || !sequence.enabled || !sequence.actions?.length) {
      return { executed: false, success: true };
    }

    // Execute the sequence
    const startTime = Date.now();
    const result = await executeSequence(serverId, sequence);
    const duration = Date.now() - startTime;

    // Log execution
    const executionLog: Omit<AutomationExecutionLog, 'id'> = {
      serverId,
      sequenceId: sequence.id,
      sequenceName: sequence.name,
      trigger,
      executedAt: new Date(),
      executedBy,
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

    console.log(`[Automation] Executed ${trigger} sequence for server ${serverId}: ${result.executed} actions, ${result.failed} failed`);

    return {
      executed: true,
      success: result.errors.length === 0,
      error: result.errors.length > 0 ? result.errors.join(', ') : undefined,
    };
  } catch (error: any) {
    console.error(`[Automation] Error executing ${trigger} automation for server ${serverId}:`, error);
    return {
      executed: false,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute a sequence of actions
 */
async function executeSequence(
  serverId: string,
  sequence: AutomationSequence
): Promise<{ executed: number; failed: number; errors: string[] }> {
  const result = { executed: 0, failed: 0, errors: [] as string[] };
  
  // Sort actions by order
  const sortedActions = [...sequence.actions]
    .filter(a => a.enabled)
    .sort((a, b) => a.order - b.order);

  for (const action of sortedActions) {
    try {
      await executeAction(serverId, action);
      result.executed++;
    } catch (error: any) {
      result.failed++;
      result.errors.push(`Action ${action.id} (${action.type}): ${error.message}`);
      console.error(`[Automation] Error executing action ${action.id}:`, error);
    }
  }

  return result;
}

/**
 * Execute a single action
 */
async function executeAction(serverId: string, action: AutomationAction): Promise<void> {
  const { type, config } = action;
  const target = config.targetSelector || '@a';

  switch (type) {
    case 'command':
      if (config.command) {
        let cmd = config.command.trim();
        if (cmd.startsWith('/')) cmd = cmd.slice(1);
        await executeServerCommand(serverId, cmd);
      }
      break;

    case 'title':
      await executeTitle(serverId, 'title', config, target);
      break;

    case 'subtitle':
      await executeTitle(serverId, 'subtitle', config, target);
      break;

    case 'actionbar':
      await executeTitle(serverId, 'actionbar', config, target);
      break;

    case 'message':
      if (config.text) {
        const formattedText = formatMinecraftJson(config.text, config);
        await executeServerCommand(serverId, `tellraw ${target} ${formattedText}`);
      }
      break;

    case 'delay':
      if (config.delaySeconds && config.delaySeconds > 0) {
        await sleep(config.delaySeconds * 1000);
      }
      break;

    case 'countdown':
      await executeCountdown(serverId, config, target);
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

/**
 * Execute title command
 */
async function executeTitle(
  serverId: string,
  titleType: 'title' | 'subtitle' | 'actionbar',
  config: AutomationAction['config'],
  target: string
): Promise<void> {
  if (!config.text) return;

  // Configure timing for title
  if (titleType === 'title' && (config.fadeIn || config.stay || config.fadeOut)) {
    const fadeIn = config.fadeIn ?? 10;
    const stay = config.stay ?? 70;
    const fadeOut = config.fadeOut ?? 20;
    await executeServerCommand(serverId, `title ${target} times ${fadeIn} ${stay} ${fadeOut}`);
  }

  const formattedText = formatMinecraftJson(config.text, config);
  await executeServerCommand(serverId, `title ${target} ${titleType} ${formattedText}`);
}

/**
 * Execute countdown sequence
 */
async function executeCountdown(
  serverId: string,
  config: AutomationAction['config'],
  target: string
): Promise<void> {
  const countdownFrom = config.countdownFrom ?? 5;
  const interval = (config.countdownInterval ?? 1) * 1000;
  const message = config.countdownMessage ?? '{seconds}';

  for (let i = countdownFrom; i >= 1; i--) {
    const text = message.replace(/{seconds}/g, i.toString());
    const formattedText = formatMinecraftJson(text, config);
    await executeServerCommand(serverId, `title ${target} title ${formattedText}`);
    
    // Play tick sound
    await executeServerCommand(
      serverId,
      `playsound minecraft:block.note_block.pling master ${target} ~ ~ ~ 0.5 ${i === 1 ? 2 : 1}`
    );
    
    if (i > 1) {
      await sleep(interval);
    }
  }
}

/**
 * Format text to Minecraft JSON format
 */
function formatMinecraftJson(text: string, config: AutomationAction['config']): string {
  const jsonObj: Record<string, any> = { text };
  
  if (config.color) jsonObj.color = config.color;
  if (config.bold) jsonObj.bold = true;
  if (config.italic) jsonObj.italic = true;
  
  return JSON.stringify(jsonObj);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
