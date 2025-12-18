'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Square, 
  RotateCw, 
  Users, 
  Loader2, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Clock, 
  Zap, 
  Globe, 
  MessageSquare, 
  Send, 
  Sun, 
  Moon, 
  Cloud, 
  CloudRain, 
  Gamepad2, 
  Copy, 
  Check,
  Terminal,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useServerCommand } from '@/lib/useServerCommand';
import { useServerStatus } from '@/lib/useServerStatus';
import { OnlinePlayersCompact } from '@/components/OnlinePlayers';
import { LastOnlineBadge } from '@/components/PlayerHistory';

interface Server {
  id: string;
  name: string;
  address: string;
  status: number;
  players?: {
    count: number;
    max: number;
    list?: string[];
  };
}

interface ServerCardProps {
  server: Server;
  isAdmin: boolean;
  onUpdate: () => void;
  iconUrl?: string;
  lastOnlineAt?: Date | string;
}

type CommandType = 'custom' | 'message' | 'time' | 'weather' | 'gamemode';

export default function ServerCard({ server: initialServer, isAdmin, onUpdate, iconUrl, lastOnlineAt }: ServerCardProps) {
  const router = useRouter();
  const t = useTranslations('servers');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  
  // Use centralized server status hook
  const { 
    server, 
    isLive, 
    error: statusError, 
    notifyActionTaken 
  } = useServerStatus({
    serverId: initialServer.id,
    initialServer: initialServer
  });

  const displayServer = server || initialServer;

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'start' | 'stop' | 'restart' | null }>({ open: false, action: null });
  const [commandDialog, setCommandDialog] = useState(false);
  const [commandType, setCommandType] = useState<CommandType>('custom');
  const [command, setCommand] = useState('');
  const [commandOption, setCommandOption] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  // Use centralized command hook
  const { sendCommand: sendServerCmd, isLoading: sendingCommand } = useServerCommand({
    serverId: displayServer.id,
    serverName: displayServer.name,
    onSuccess: () => {
      setCommand('');
      setCommandOption('');
      setCommandType('custom');
      setCommandDialog(false);
    },
  });

  // Get status label from translations
  const getStatusLabel = (status: number) => {
    const statusMap: Record<number, string> = {
      0: t('status.offline'),
      1: t('status.online'),
      2: t('status.starting'),
      3: t('status.stopping'),
      4: t('status.restarting'),
      5: t('status.saving'),
      6: t('status.loading'),
      7: t('status.crashed'),
      10: t('status.preparing'),
    };
    return statusMap[status] || t('status.unknown');
  };

  const currentStatus = displayServer.status;

  const STATUS_CONFIG: Record<number, { 
    color: string; 
    bgColor: string; 
    borderColor: string;
    glowColor: string;
    gradientFrom: string;
    gradientTo: string;
  }> = {
    0: { 
      color: 'text-slate-400', 
      bgColor: 'bg-slate-500/10', 
      borderColor: 'border-slate-500/20',
      glowColor: 'shadow-slate-500/20',
      gradientFrom: 'from-slate-500',
      gradientTo: 'to-slate-600'
    },
    1: { 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-500/10', 
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/25',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-green-600'
    },
    2: { 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-500/10', 
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/25',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-yellow-600'
    },
    3: { 
      color: 'text-orange-500', 
      bgColor: 'bg-orange-500/10', 
      borderColor: 'border-orange-500/30',
      glowColor: 'shadow-orange-500/25',
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-red-600'
    },
    4: { 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-500/10', 
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/25',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-indigo-600'
    },
    5: { 
      color: 'text-cyan-500', 
      bgColor: 'bg-cyan-500/10', 
      borderColor: 'border-cyan-500/30',
      glowColor: 'shadow-cyan-500/25',
      gradientFrom: 'from-cyan-500',
      gradientTo: 'to-blue-600'
    },
    6: { 
      color: 'text-indigo-500', 
      bgColor: 'bg-indigo-500/10', 
      borderColor: 'border-indigo-500/30',
      glowColor: 'shadow-indigo-500/25',
      gradientFrom: 'from-indigo-500',
      gradientTo: 'to-purple-600'
    },
    7: { 
      color: 'text-red-500', 
      bgColor: 'bg-red-500/10', 
      borderColor: 'border-red-500/30',
      glowColor: 'shadow-red-500/25',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-rose-600'
    },
    10: { 
      color: 'text-violet-500', 
      bgColor: 'bg-violet-500/10', 
      borderColor: 'border-violet-500/30',
      glowColor: 'shadow-violet-500/25',
      gradientFrom: 'from-violet-500',
      gradientTo: 'to-purple-600'
    },
  };

  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG[0];
  const statusLabel = getStatusLabel(currentStatus);
  const isOnline = currentStatus === 1;
  const isOffline = currentStatus === 0;
  const isTransitioning = [2, 3, 4, 5, 6, 10].includes(currentStatus);
  const playerPercentage = displayServer.players ? (displayServer.players.count / displayServer.players.max) * 100 : 0;

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(action);
    setError(null);
    notifyActionTaken(); // Notify hook that action was taken

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/servers/${displayServer.id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} server`);

      const actionNames = { 
        start: t('actions.starting'), 
        stop: t('actions.stopping'), 
        restart: t('actions.restarting') 
      };
      
      toast({
        title: t('actions.commandSent'),
        description: `${displayServer.name} ${actionNames[action]}...`,
      });
      
      onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : tCommon('errorOccurred');
      setError(message);
      toast({ title: tCommon('error'), description: message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(displayServer.address);
      setAddressCopied(true);
      toast({
        title: tCommon('copied'),
        description: t('actions.addressCopied'),
      });
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      toast({ title: tCommon('error'), description: t('actions.copyError'), variant: 'destructive' });
    }
  };

  const handleSendCommand = async () => {
    let finalCommand = '';
    
    if (commandType === 'custom') {
      if (!command.trim()) return;
      finalCommand = command.trim();
    } else if (commandType === 'message') {
      if (!command.trim()) return;
      finalCommand = `say ${command.trim()}`;
    } else if (commandType === 'time') {
      if (!commandOption) return;
      finalCommand = `time set ${commandOption}`;
    } else if (commandType === 'weather') {
      if (!commandOption) return;
      finalCommand = `weather ${commandOption}`;
    } else if (commandType === 'gamemode') {
      if (!commandOption) return;
      finalCommand = `gamemode ${commandOption} @a`;
    }

    // Use the centralized hook to send command
    // The hook handles authentication, API calls, toasts, and onSuccess callback
    await sendServerCmd(finalCommand);
  };

  const handleCardClick = () => {
    router.push(`/servers/${displayServer.id}`);
  };

  return (
    <>
      <Card 
        className={cn(
          "group relative overflow-hidden cursor-pointer",
          "bg-gradient-to-br from-card via-card to-card/80",
          "border border-border/50",
          "transition-all duration-500 ease-out",
          "hover:shadow-2xl hover:-translate-y-2",
          isOnline && "hover:shadow-emerald-500/10 hover:border-emerald-500/30",
          isOffline && "hover:shadow-slate-500/10 hover:border-slate-500/30",
          isTransitioning && "hover:shadow-amber-500/10 hover:border-amber-500/30",
          error && "border-destructive/30"
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient overlay on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500",
          "bg-gradient-to-br from-primary/5 via-transparent to-transparent",
          isHovered && "opacity-100"
        )} />

        {/* Status accent bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          "bg-gradient-to-r",
          statusInfo.gradientFrom, statusInfo.gradientTo,
          isTransitioning && "animate-pulse"
        )} />

        {/* Live indicator glow */}
        {isLive && isOnline && (
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        )}

        <CardContent className="relative p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            {/* Server Icon with status ring */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "relative w-14 h-14 rounded-2xl overflow-hidden",
                "ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
                isOnline && "ring-emerald-500/50",
                isOffline && "ring-slate-500/30",
                isTransitioning && "ring-amber-500/50",
                isHovered && "scale-105"
              )}>
                {iconUrl ? (
                  <img 
                    src={iconUrl} 
                    alt={displayServer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center",
                    "bg-gradient-to-br",
                    statusInfo.gradientFrom, statusInfo.gradientTo
                  )}>
                    {isOnline ? (
                      <Wifi className="h-6 w-6 text-white" />
                    ) : isTransitioning ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <WifiOff className="h-6 w-6 text-white/80" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Status dot */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full",
                "border-2 border-background shadow-lg",
                "transition-all duration-300",
                isOnline && "bg-emerald-500",
                isOffline && "bg-slate-400",
                isTransitioning && "bg-amber-500 animate-pulse"
              )}>
                {isOnline && (
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                )}
              </div>
            </div>

            {/* Server info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className={cn(
                  "font-bold text-lg truncate transition-colors duration-300",
                  isHovered && "text-primary"
                )}>
                  {displayServer.name}
                </h3>
                
                {/* Live badge */}
                {isLive && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "flex-shrink-0 gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                      "bg-emerald-500/10"
                    )}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    {tCommon('live')}
                  </Badge>
                )}
              </div>
              
              {/* Address */}
              <button
                onClick={handleCopyAddress}
                className={cn(
                  "flex items-center gap-2 text-sm text-muted-foreground",
                  "hover:text-foreground transition-colors group/addr"
                )}
              >
                <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                <code className="truncate max-w-[160px] font-mono text-xs">{displayServer.address}</code>
                <span className={cn(
                  "transition-all duration-200",
                  addressCopied ? "opacity-100" : "opacity-0 group-hover/addr:opacity-100"
                )}>
                  {addressCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Status and players row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <Badge 
              variant="secondary"
              className={cn(
                "gap-1.5 font-semibold px-3 py-1",
                "transition-all duration-300",
                statusInfo.bgColor, statusInfo.color,
                "border", statusInfo.borderColor
              )}
            >
              {isOnline && <Zap className="h-3.5 w-3.5" />}
              {isOffline && <WifiOff className="h-3.5 w-3.5" />}
              {isTransitioning && <Clock className="h-3.5 w-3.5 animate-spin" />}
              {statusLabel}
            </Badge>

            {displayServer.players && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full",
                "bg-muted/50 border border-border/50"
              )}>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-bold tabular-nums text-sm">
                  {displayServer.players.count}
                  <span className="text-muted-foreground font-normal">/{displayServer.players.max}</span>
                </span>
              </div>
            )}
          </div>

          {/* Online players preview */}
          {isOnline && displayServer.players && displayServer.players.list && displayServer.players.list.length > 0 && (
            <div className="mb-4">
              <OnlinePlayersCompact 
                players={displayServer.players.list} 
                maxShow={4}
                className="justify-start"
              />
            </div>
          )}

          {/* Last online indicator for offline servers */}
          {isOffline && lastOnlineAt && (
            <div className="mb-4">
              <LastOnlineBadge 
                lastOnlineAt={lastOnlineAt}
                serverStatus={displayServer.status}
              />
            </div>
          )}

          {/* Player capacity bar */}
          {displayServer.players && (
            <div className="mb-5">
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    "bg-gradient-to-r",
                    isOnline ? "from-emerald-500 to-green-400" : "from-slate-400 to-slate-500",
                    playerPercentage > 80 && isOnline && "from-amber-500 to-orange-400",
                    playerPercentage === 100 && isOnline && "from-red-500 to-rose-400"
                  )}
                  style={{ width: `${Math.max(playerPercentage, 2)}%` }}
                />
              </div>
              {playerPercentage > 80 && isOnline && (
                <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {locale === 'pt-BR' ? 'Servidor quase cheio!' : 'Server almost full!'}
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive mb-4 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Offline: Start button */}
            {isOffline && (
              <Button
                onClick={() => handleAction('start')}
                disabled={loading !== null}
                className={cn(
                  "flex-1 gap-2 font-semibold",
                  "bg-gradient-to-r from-emerald-600 to-green-600",
                  "hover:from-emerald-500 hover:to-green-500",
                  "shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40",
                  "transition-all duration-300"
                )}
                size="sm"
              >
                {loading === 'start' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" fill="currentColor" />
                )}
                {t('actions.start')}
              </Button>
            )}

            {/* Transitioning: Status button */}
            {isTransitioning && (
              <Button
                disabled
                variant="outline"
                className="flex-1 gap-2 font-semibold"
                size="sm"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {statusLabel}...
              </Button>
            )}

            {/* Online: Control buttons */}
            {isOnline && (
              <>
                <Button
                  onClick={() => setConfirmDialog({ open: true, action: 'stop' })}
                  disabled={loading !== null}
                  variant="destructive"
                  className={cn(
                    "flex-1 gap-2 font-semibold",
                    "shadow-lg shadow-red-500/20 hover:shadow-red-500/30",
                    "transition-all duration-300"
                  )}
                  size="sm"
                >
                  {loading === 'stop' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" fill="currentColor" />
                  )}
                  {t('actions.stop')}
                </Button>

                <Button
                  onClick={() => setConfirmDialog({ open: true, action: 'restart' })}
                  disabled={loading !== null}
                  variant="outline"
                  size="sm"
                  className="gap-2 font-semibold hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                >
                  {loading === 'restart' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{t('actions.restart')}</span>
                </Button>

                {isAdmin && (
                  <Button
                    onClick={() => setCommandDialog(true)}
                    disabled={loading !== null}
                    variant="outline"
                    size="sm"
                    className="gap-2 font-semibold hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-300"
                  >
                    <Terminal className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* View details button */}
            <Button
              onClick={handleCardClick}
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1 ml-auto transition-all duration-300",
                isHovered && "translate-x-0.5"
              )}
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform duration-300",
                isHovered && "translate-x-0.5"
              )} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, action: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-full",
                confirmDialog.action === 'stop' ? "bg-destructive/10" : "bg-blue-500/10"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  confirmDialog.action === 'stop' ? "text-destructive" : "text-blue-500"
                )} />
              </div>
              {t('actions.confirmAction')}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {confirmDialog.action === 'stop' && (
                locale === 'pt-BR' 
                  ? <>Tem certeza que deseja <strong className="text-destructive">parar</strong> o servidor <strong>{displayServer.name}</strong>? Os jogadores online serão desconectados.</>
                  : <>Are you sure you want to <strong className="text-destructive">stop</strong> the server <strong>{displayServer.name}</strong>? Online players will be disconnected.</>
              )}
              {confirmDialog.action === 'restart' && (
                locale === 'pt-BR'
                  ? <>Tem certeza que deseja <strong className="text-blue-500">reiniciar</strong> o servidor <strong>{displayServer.name}</strong>? Os jogadores online serão desconectados temporariamente.</>
                  : <>Are you sure you want to <strong className="text-blue-500">restart</strong> the server <strong>{displayServer.name}</strong>? Online players will be temporarily disconnected.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: null })}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant={confirmDialog.action === 'stop' ? 'destructive' : 'default'}
              onClick={() => {
                if (confirmDialog.action) {
                  handleAction(confirmDialog.action);
                  setConfirmDialog({ open: false, action: null });
                }
              }}
            >
              {tCommon('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Command Dialog */}
      <Dialog open={commandDialog} onOpenChange={(open) => {
        setCommandDialog(open);
        if (!open) {
          setCommand('');
          setCommandOption('');
          setCommandType('custom');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-violet-500/10">
                <Terminal className="h-5 w-5 text-violet-500" />
              </div>
              {t('actions.sendCommand')}
            </DialogTitle>
            <DialogDescription>
              {locale === 'pt-BR' 
                ? <>Execute comandos no servidor <strong>{displayServer.name}</strong></>
                : <>Execute commands on server <strong>{displayServer.name}</strong></>
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('command.type')}</Label>
              <Select value={commandType} onValueChange={(v) => {
                setCommandType(v as CommandType);
                setCommand('');
                setCommandOption('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      {t('command.custom')}
                    </div>
                  </SelectItem>
                  <SelectItem value="message">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('command.sendMessage')}
                    </div>
                  </SelectItem>
                  <SelectItem value="time">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('command.changeTime')}
                    </div>
                  </SelectItem>
                  <SelectItem value="weather">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      {t('command.changeWeather')}
                    </div>
                  </SelectItem>
                  <SelectItem value="gamemode">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {t('command.gameMode')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(commandType === 'custom' || commandType === 'message') && (
              <div className="space-y-2">
                <Label>{commandType === 'custom' ? t('command.command') : t('command.message')}</Label>
                <Input
                  placeholder={commandType === 'custom' 
                    ? (locale === 'pt-BR' ? 'Ex: give @a diamond 64' : 'Ex: give @a diamond 64')
                    : (locale === 'pt-BR' ? 'Digite a mensagem...' : 'Type the message...')
                  }
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                  className="font-mono"
                />
                {commandType === 'custom' && (
                  <p className="text-xs text-muted-foreground">
                    {t('command.noSlash')}
                  </p>
                )}
              </div>
            )}

            {commandType === 'time' && (
              <div className="space-y-2">
                <Label>{t('command.time')}</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('command.selectTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day"><Sun className="inline h-4 w-4 mr-2" />{t('command.day')}</SelectItem>
                    <SelectItem value="noon"><Sun className="inline h-4 w-4 mr-2" />{t('command.noon')}</SelectItem>
                    <SelectItem value="night"><Moon className="inline h-4 w-4 mr-2" />{t('command.night')}</SelectItem>
                    <SelectItem value="midnight"><Moon className="inline h-4 w-4 mr-2" />{t('command.midnight')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {commandType === 'weather' && (
              <div className="space-y-2">
                <Label>{t('command.weather')}</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('command.selectWeather')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear"><Sun className="inline h-4 w-4 mr-2" />{t('command.clear')}</SelectItem>
                    <SelectItem value="rain"><Cloud className="inline h-4 w-4 mr-2" />{t('command.rain')}</SelectItem>
                    <SelectItem value="thunder"><CloudRain className="inline h-4 w-4 mr-2" />{t('command.thunder')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {commandType === 'gamemode' && (
              <div className="space-y-2">
                <Label>{t('command.gameModeForAll')}</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('command.selectMode')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survival">⚔️ Survival</SelectItem>
                    <SelectItem value="creative">🎨 Creative</SelectItem>
                    <SelectItem value="adventure">🗺️ Adventure</SelectItem>
                    <SelectItem value="spectator">👻 Spectator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCommandDialog(false)}>
              {tCommon('cancel')}
            </Button>
            <Button 
              onClick={handleSendCommand} 
              disabled={sendingCommand}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            >
              {sendingCommand ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {tCommon('execute')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
