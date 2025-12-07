'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageSquare,
  Send,
  Gamepad2,
  Shield,
  Swords,
  Package,
  MapPin,
  Clock,
  Zap,
  Heart,
  Star,
  Ban,
  UserX,
  UserCheck,
  Volume2,
  VolumeX,
  Eye,
  Skull,
  Sparkles,
  Flame,
  Snowflake,
  Sun,
  Moon,
  CloudRain,
  Wand2,
  Crown,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Copy,
  User,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

// Action categories
type ActionCategory = 'communication' | 'gamemode' | 'moderation' | 'items' | 'effects' | 'teleport' | 'world' | 'advanced';

interface ActionItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  command: string | ((player: string, value?: string) => string);
  requiresInput?: boolean;
  inputType?: 'text' | 'number' | 'select';
  inputPlaceholder?: string;
  inputOptions?: { value: string; labelKey: string }[];
  dangerous?: boolean;
  description?: string;
}

interface ActionCategoryConfig {
  id: ActionCategory;
  labelKey: string;
  icon: React.ReactNode;
  actions: ActionItem[];
}

// Define all action categories and their actions
const ACTION_CATEGORIES: ActionCategoryConfig[] = [
  {
    id: 'communication',
    labelKey: 'communication',
    icon: <MessageSquare className="h-4 w-4" />,
    actions: [
      {
        id: 'msg',
        labelKey: 'sendMessage',
        icon: <MessageSquare className="h-4 w-4" />,
        command: (player, msg) => `msg ${player} ${msg}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'messageToSend',
      },
      {
        id: 'tell',
        labelKey: 'whisper',
        icon: <Volume2 className="h-4 w-4" />,
        command: (player, msg) => `tell ${player} ${msg}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'messageToSend',
      },
      {
        id: 'say',
        labelKey: 'sayPublic',
        icon: <Send className="h-4 w-4" />,
        command: (player, msg) => `say ${msg}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'publicMessage',
      },
      {
        id: 'title',
        labelKey: 'showTitle',
        icon: <Star className="h-4 w-4" />,
        command: (player, msg) => `title ${player} title {"text":"${msg}","color":"gold"}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'titleText',
      },
      {
        id: 'subtitle',
        labelKey: 'showSubtitle',
        icon: <Star className="h-4 w-4" />,
        command: (player, msg) => `title ${player} subtitle {"text":"${msg}","color":"yellow"}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'subtitleText',
      },
      {
        id: 'actionbar',
        labelKey: 'showActionBar',
        icon: <Terminal className="h-4 w-4" />,
        command: (player, msg) => `title ${player} actionbar {"text":"${msg}","color":"green"}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'actionBarText',
      },
    ],
  },
  {
    id: 'gamemode',
    labelKey: 'gamemode',
    icon: <Gamepad2 className="h-4 w-4" />,
    actions: [
      {
        id: 'gm_survival',
        labelKey: 'survival',
        icon: <Swords className="h-4 w-4" />,
        command: (player) => `gamemode survival ${player}`,
      },
      {
        id: 'gm_creative',
        labelKey: 'creative',
        icon: <Sparkles className="h-4 w-4" />,
        command: (player) => `gamemode creative ${player}`,
      },
      {
        id: 'gm_adventure',
        labelKey: 'adventure',
        icon: <MapPin className="h-4 w-4" />,
        command: (player) => `gamemode adventure ${player}`,
      },
      {
        id: 'gm_spectator',
        labelKey: 'spectator',
        icon: <Eye className="h-4 w-4" />,
        command: (player) => `gamemode spectator ${player}`,
      },
    ],
  },
  {
    id: 'moderation',
    labelKey: 'moderation',
    icon: <Shield className="h-4 w-4" />,
    actions: [
      {
        id: 'kick',
        labelKey: 'kick',
        icon: <UserX className="h-4 w-4" />,
        command: (player, reason) => reason ? `kick ${player} ${reason}` : `kick ${player}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'kickReason',
        dangerous: true,
      },
      {
        id: 'ban',
        labelKey: 'ban',
        icon: <Ban className="h-4 w-4" />,
        command: (player, reason) => reason ? `ban ${player} ${reason}` : `ban ${player}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'banReason',
        dangerous: true,
      },
      {
        id: 'tempban',
        labelKey: 'tempBan',
        icon: <Clock className="h-4 w-4" />,
        command: (player, duration) => `tempban ${player} ${duration || '1h'}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'banDuration',
        dangerous: true,
      },
      {
        id: 'mute',
        labelKey: 'mute',
        icon: <VolumeX className="h-4 w-4" />,
        command: (player) => `mute ${player}`,
        dangerous: true,
      },
      {
        id: 'unmute',
        labelKey: 'unmute',
        icon: <Volume2 className="h-4 w-4" />,
        command: (player) => `unmute ${player}`,
      },
      {
        id: 'op',
        labelKey: 'giveOp',
        icon: <Crown className="h-4 w-4" />,
        command: (player) => `op ${player}`,
        dangerous: true,
      },
      {
        id: 'deop',
        labelKey: 'removeOp',
        icon: <UserCheck className="h-4 w-4" />,
        command: (player) => `deop ${player}`,
      },
      {
        id: 'whitelist_add',
        labelKey: 'addToWhitelist',
        icon: <UserCheck className="h-4 w-4" />,
        command: (player) => `whitelist add ${player}`,
      },
      {
        id: 'whitelist_remove',
        labelKey: 'removeFromWhitelist',
        icon: <UserX className="h-4 w-4" />,
        command: (player) => `whitelist remove ${player}`,
        dangerous: true,
      },
    ],
  },
  {
    id: 'items',
    labelKey: 'items',
    icon: <Package className="h-4 w-4" />,
    actions: [
      {
        id: 'give_diamond',
        labelKey: 'giveDiamond',
        icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
        command: (player, amount) => `give ${player} diamond ${amount || 64}`,
        requiresInput: true,
        inputType: 'number',
        inputPlaceholder: 'amount',
      },
      {
        id: 'give_diamond_sword',
        labelKey: 'giveDiamondSword',
        icon: <Swords className="h-4 w-4 text-cyan-400" />,
        command: (player) => `give ${player} diamond_sword 1`,
      },
      {
        id: 'give_diamond_armor',
        labelKey: 'giveDiamondArmor',
        icon: <Shield className="h-4 w-4 text-cyan-400" />,
        command: (player) => `give ${player} diamond_helmet 1 && give ${player} diamond_chestplate 1 && give ${player} diamond_leggings 1 && give ${player} diamond_boots 1`,
      },
      {
        id: 'give_netherite_sword',
        labelKey: 'giveNetheriteSword',
        icon: <Swords className="h-4 w-4 text-gray-600" />,
        command: (player) => `give ${player} netherite_sword 1`,
      },
      {
        id: 'give_netherite_armor',
        labelKey: 'giveNetheriteArmor',
        icon: <Shield className="h-4 w-4 text-gray-600" />,
        command: (player) => `give ${player} netherite_helmet 1 && give ${player} netherite_chestplate 1 && give ${player} netherite_leggings 1 && give ${player} netherite_boots 1`,
      },
      {
        id: 'give_elytra',
        labelKey: 'giveElytra',
        icon: <Sparkles className="h-4 w-4 text-purple-400" />,
        command: (player) => `give ${player} elytra 1`,
      },
      {
        id: 'give_totem',
        labelKey: 'giveTotem',
        icon: <Heart className="h-4 w-4 text-yellow-400" />,
        command: (player) => `give ${player} totem_of_undying 1`,
      },
      {
        id: 'give_custom',
        labelKey: 'giveCustomItem',
        icon: <Package className="h-4 w-4" />,
        command: (player, item) => `give ${player} ${item}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'itemIdAndAmount',
      },
      {
        id: 'clear_inventory',
        labelKey: 'clearInventory',
        icon: <X className="h-4 w-4" />,
        command: (player) => `clear ${player}`,
        dangerous: true,
      },
    ],
  },
  {
    id: 'effects',
    labelKey: 'effects',
    icon: <Wand2 className="h-4 w-4" />,
    actions: [
      {
        id: 'effect_speed',
        labelKey: 'giveSpeed',
        icon: <Zap className="h-4 w-4 text-sky-400" />,
        command: (player) => `effect give ${player} speed 300 2`,
      },
      {
        id: 'effect_strength',
        labelKey: 'giveStrength',
        icon: <Swords className="h-4 w-4 text-red-400" />,
        command: (player) => `effect give ${player} strength 300 2`,
      },
      {
        id: 'effect_regeneration',
        labelKey: 'giveRegeneration',
        icon: <Heart className="h-4 w-4 text-pink-400" />,
        command: (player) => `effect give ${player} regeneration 300 2`,
      },
      {
        id: 'effect_resistance',
        labelKey: 'giveResistance',
        icon: <Shield className="h-4 w-4 text-gray-400" />,
        command: (player) => `effect give ${player} resistance 300 2`,
      },
      {
        id: 'effect_fire_resistance',
        labelKey: 'giveFireResistance',
        icon: <Flame className="h-4 w-4 text-orange-400" />,
        command: (player) => `effect give ${player} fire_resistance 300`,
      },
      {
        id: 'effect_night_vision',
        labelKey: 'giveNightVision',
        icon: <Eye className="h-4 w-4 text-blue-400" />,
        command: (player) => `effect give ${player} night_vision 300`,
      },
      {
        id: 'effect_invisibility',
        labelKey: 'giveInvisibility',
        icon: <Eye className="h-4 w-4 text-gray-300" />,
        command: (player) => `effect give ${player} invisibility 300`,
      },
      {
        id: 'effect_jump_boost',
        labelKey: 'giveJumpBoost',
        icon: <ChevronRight className="h-4 w-4 rotate-[-90deg] text-green-400" />,
        command: (player) => `effect give ${player} jump_boost 300 2`,
      },
      {
        id: 'effect_slow_falling',
        labelKey: 'giveSlowFalling',
        icon: <Snowflake className="h-4 w-4 text-white" />,
        command: (player) => `effect give ${player} slow_falling 300`,
      },
      {
        id: 'effect_clear',
        labelKey: 'clearEffects',
        icon: <X className="h-4 w-4" />,
        command: (player) => `effect clear ${player}`,
      },
    ],
  },
  {
    id: 'teleport',
    labelKey: 'teleport',
    icon: <MapPin className="h-4 w-4" />,
    actions: [
      {
        id: 'tp_spawn',
        labelKey: 'teleportToSpawn',
        icon: <MapPin className="h-4 w-4 text-green-400" />,
        command: (player) => `tp ${player} 0 100 0`,
      },
      {
        id: 'tp_coords',
        labelKey: 'teleportToCoords',
        icon: <MapPin className="h-4 w-4" />,
        command: (player, coords) => `tp ${player} ${coords}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'coordinates',
      },
      {
        id: 'tp_to_player',
        labelKey: 'teleportToPlayer',
        icon: <User className="h-4 w-4" />,
        command: (player, target) => `tp ${player} ${target}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'targetPlayer',
      },
      {
        id: 'tp_player_here',
        labelKey: 'teleportPlayerHere',
        icon: <User className="h-4 w-4" />,
        command: (player, target) => `tp ${target} ${player}`,
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'targetPlayer',
      },
      {
        id: 'tp_nether',
        labelKey: 'teleportToNether',
        icon: <Flame className="h-4 w-4 text-red-500" />,
        command: (player) => `execute in minecraft:the_nether run tp ${player} ~ ~ ~`,
      },
      {
        id: 'tp_end',
        labelKey: 'teleportToEnd',
        icon: <Skull className="h-4 w-4 text-purple-500" />,
        command: (player) => `execute in minecraft:the_end run tp ${player} ~ ~ ~`,
      },
      {
        id: 'tp_overworld',
        labelKey: 'teleportToOverworld',
        icon: <Sun className="h-4 w-4 text-yellow-400" />,
        command: (player) => `execute in minecraft:overworld run tp ${player} ~ ~ ~`,
      },
    ],
  },
  {
    id: 'world',
    labelKey: 'world',
    icon: <Sun className="h-4 w-4" />,
    actions: [
      {
        id: 'time_day',
        labelKey: 'setTimeDay',
        icon: <Sun className="h-4 w-4 text-yellow-400" />,
        command: () => `time set day`,
      },
      {
        id: 'time_night',
        labelKey: 'setTimeNight',
        icon: <Moon className="h-4 w-4 text-blue-400" />,
        command: () => `time set night`,
      },
      {
        id: 'weather_clear',
        labelKey: 'weatherClear',
        icon: <Sun className="h-4 w-4 text-yellow-400" />,
        command: () => `weather clear`,
      },
      {
        id: 'weather_rain',
        labelKey: 'weatherRain',
        icon: <CloudRain className="h-4 w-4 text-blue-400" />,
        command: () => `weather rain`,
      },
      {
        id: 'weather_thunder',
        labelKey: 'weatherThunder',
        icon: <Zap className="h-4 w-4 text-yellow-400" />,
        command: () => `weather thunder`,
      },
    ],
  },
  {
    id: 'advanced',
    labelKey: 'advanced',
    icon: <Terminal className="h-4 w-4" />,
    actions: [
      {
        id: 'heal',
        labelKey: 'healPlayer',
        icon: <Heart className="h-4 w-4 text-red-400" />,
        command: (player) => `effect give ${player} instant_health 1 10`,
      },
      {
        id: 'feed',
        labelKey: 'feedPlayer',
        icon: <Sparkles className="h-4 w-4 text-yellow-400" />,
        command: (player) => `effect give ${player} saturation 1 10`,
      },
      {
        id: 'kill',
        labelKey: 'killPlayer',
        icon: <Skull className="h-4 w-4 text-red-600" />,
        command: (player) => `kill ${player}`,
        dangerous: true,
      },
      {
        id: 'smite',
        labelKey: 'smitePlayer',
        icon: <Zap className="h-4 w-4 text-yellow-400" />,
        command: (player) => `execute at ${player} run summon lightning_bolt`,
      },
      {
        id: 'fly_enable',
        labelKey: 'enableFlight',
        icon: <Sparkles className="h-4 w-4 text-sky-400" />,
        command: (player) => `execute as ${player} run ability @s mayfly true`,
      },
      {
        id: 'god_mode',
        labelKey: 'godMode',
        icon: <Crown className="h-4 w-4 text-yellow-400" />,
        command: (player) => `effect give ${player} resistance 99999 255 true`,
      },
      {
        id: 'xp_add',
        labelKey: 'addXP',
        icon: <Star className="h-4 w-4 text-green-400" />,
        command: (player, amount) => `xp add ${player} ${amount || 1000}`,
        requiresInput: true,
        inputType: 'number',
        inputPlaceholder: 'xpAmount',
      },
      {
        id: 'xp_levels',
        labelKey: 'addLevels',
        icon: <Star className="h-4 w-4 text-green-400" />,
        command: (player, amount) => `xp add ${player} ${amount || 30} levels`,
        requiresInput: true,
        inputType: 'number',
        inputPlaceholder: 'levelAmount',
      },
      {
        id: 'custom_command',
        labelKey: 'customCommand',
        icon: <Terminal className="h-4 w-4" />,
        command: (player, cmd) => cmd?.replace('{player}', player) || '',
        requiresInput: true,
        inputType: 'text',
        inputPlaceholder: 'customCommandPlaceholder',
      },
    ],
  },
];

interface PlayerActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onExecuteCommand: (command: string) => Promise<void>;
  recentMessage?: string;
}

export function PlayerActionMenu({
  isOpen,
  onClose,
  playerName,
  onExecuteCommand,
  recentMessage,
}: PlayerActionMenuProps) {
  const t = useTranslations('servers.console.playerActions');
  const tCommon = useTranslations('common');
  
  const [activeCategory, setActiveCategory] = useState<ActionCategory>('communication');
  const [inputValue, setInputValue] = useState('');
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [lastExecuted, setLastExecuted] = useState<{ action: string; success: boolean } | null>(null);
  const [confirmDangerous, setConfirmDangerous] = useState<string | null>(null);

  const handleExecuteAction = useCallback(async (action: ActionItem) => {
    // If action is dangerous and not confirmed, ask for confirmation
    if (action.dangerous && confirmDangerous !== action.id) {
      setConfirmDangerous(action.id);
      return;
    }

    setExecutingAction(action.id);
    setConfirmDangerous(null);
    
    try {
      let command: string;
      if (typeof action.command === 'function') {
        command = action.command(playerName, inputValue || undefined);
      } else {
        command = action.command.replace('{player}', playerName);
      }

      // Handle multiple commands (separated by &&)
      const commands = command.split('&&').map(c => c.trim());
      
      for (const cmd of commands) {
        if (cmd) {
          await onExecuteCommand(cmd);
        }
      }

      setLastExecuted({ action: action.id, success: true });
      setInputValue('');
      
      // Clear success indicator after 2 seconds
      setTimeout(() => {
        setLastExecuted(null);
      }, 2000);
    } catch (error) {
      console.error('Error executing action:', error);
      setLastExecuted({ action: action.id, success: false });
      
      setTimeout(() => {
        setLastExecuted(null);
      }, 2000);
    } finally {
      setExecutingAction(null);
    }
  }, [playerName, inputValue, onExecuteCommand, confirmDangerous]);

  const handleCopyPlayerName = useCallback(() => {
    navigator.clipboard.writeText(playerName);
  }, [playerName]);

  const currentCategory = ACTION_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{playerName}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCopyPlayerName}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('copyName')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-muted-foreground">{t('playerActions')}</span>
            </div>
          </DialogTitle>
          {recentMessage && (
            <DialogDescription className="mt-2 p-2 bg-muted rounded-md text-sm italic">
              &ldquo;{recentMessage}&rdquo;
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ActionCategory)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0 grid grid-cols-4 lg:grid-cols-8 h-auto gap-1 p-1 bg-muted/50">
              {ACTION_CATEGORIES.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
                >
                  {category.icon}
                  <span className="hidden sm:inline truncate max-w-full">{t(`categories.${category.labelKey}`)}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {ACTION_CATEGORIES.map((category) => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="m-0 h-full"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.actions.map((action) => {
                      const isExecuting = executingAction === action.id;
                      const isSuccess = lastExecuted?.action === action.id && lastExecuted.success;
                      const isFailed = lastExecuted?.action === action.id && !lastExecuted.success;
                      const needsConfirmation = confirmDangerous === action.id;

                      return (
                        <div
                          key={action.id}
                          className={cn(
                            "rounded-lg border p-3 transition-all",
                            action.dangerous 
                              ? "border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800" 
                              : "border-border hover:border-primary/50",
                            needsConfirmation && "ring-2 ring-red-500 border-red-500"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "rounded-lg p-2 flex-shrink-0",
                              action.dangerous 
                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                                : "bg-muted text-muted-foreground"
                            )}>
                              {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {t(`actions.${action.labelKey}`)}
                                </span>
                                {action.dangerous && (
                                  <Badge variant="destructive" className="text-xs px-1 py-0">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {t('dangerous')}
                                  </Badge>
                                )}
                              </div>
                              
                              {action.requiresInput && (
                                <div className="mt-2">
                                  {action.inputType === 'select' && action.inputOptions ? (
                                    <Select value={inputValue} onValueChange={setInputValue}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder={t(`placeholders.${action.inputPlaceholder}`)} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {action.inputOptions.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {t(`options.${opt.labelKey}`)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      type={action.inputType === 'number' ? 'number' : 'text'}
                                      value={inputValue}
                                      onChange={(e) => setInputValue(e.target.value)}
                                      placeholder={t(`placeholders.${action.inputPlaceholder}`)}
                                      className="h-8 text-sm"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && inputValue) {
                                          handleExecuteAction(action);
                                        }
                                      }}
                                    />
                                  )}
                                </div>
                              )}

                              <div className="mt-2 flex items-center gap-2">
                                {needsConfirmation ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-7 text-xs"
                                      onClick={() => handleExecuteAction(action)}
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      {t('confirmAction')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => setConfirmDangerous(null)}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      {tCommon('cancel')}
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant={action.dangerous ? "destructive" : "default"}
                                    className={cn(
                                      "h-7 text-xs transition-all",
                                      isSuccess && "bg-green-500 hover:bg-green-600",
                                      isFailed && "bg-red-500 hover:bg-red-600"
                                    )}
                                    disabled={isExecuting || (action.requiresInput && !inputValue)}
                                    onClick={() => handleExecuteAction(action)}
                                  >
                                    {isExecuting ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        {t('executing')}
                                      </>
                                    ) : isSuccess ? (
                                      <>
                                        <Check className="h-3 w-3 mr-1" />
                                        {t('executed')}
                                      </>
                                    ) : isFailed ? (
                                      <>
                                        <X className="h-3 w-3 mr-1" />
                                        {t('failed')}
                                      </>
                                    ) : (
                                      <>
                                        <Send className="h-3 w-3 mr-1" />
                                        {t('execute')}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        <Separator className="my-4" />

        <div className="flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t('hint')}
          </p>
          <Button variant="outline" onClick={onClose}>
            {tCommon('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
