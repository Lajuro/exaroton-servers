'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Power, Square, RotateCcw, Loader2, Send, Settings, CheckCircle2, Terminal, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/lib/useTranslations';
import { cn } from '@/lib/utils';

interface ServerControlsProps {
  serverStatus: number;
  actionLoading: string | null;
  sendingCommand: boolean;
  onAction: (action: 'start' | 'stop' | 'restart') => Promise<void>;
  onSendCommand: (command: string) => Promise<boolean>;
  isAdmin?: boolean;
}

// Server status constants (from Exaroton API)
const STATUS = {
  OFFLINE: 0,
  ONLINE: 1,
  STARTING: 2,
  STOPPING: 3,
  RESTARTING: 4,
  SAVING: 5,
  LOADING: 6,
  CRASHED: 7,
  PENDING: 8,
  PREPARING: 10,
} as const;

// Status groups
const TRANSITION_STATUSES: number[] = [
  STATUS.STARTING,
  STATUS.STOPPING,
  STATUS.RESTARTING,
  STATUS.SAVING,
  STATUS.LOADING,
  STATUS.PENDING,
  STATUS.PREPARING,
];

// Quick commands for admins - using translation keys
const QUICK_COMMANDS = [
  { value: 'say Hello!', labelKey: 'sayHello', icon: '💬' },
  { value: 'list', labelKey: 'listPlayers', icon: '👥' },
  { value: 'time set day', labelKey: 'setDay', icon: '☀️' },
  { value: 'time set night', labelKey: 'setNight', icon: '🌙' },
  { value: 'weather clear', labelKey: 'clearWeather', icon: '🌤️' },
  { value: 'difficulty peaceful', labelKey: 'peaceful', icon: '🕊️' },
  { value: 'difficulty normal', labelKey: 'normal', icon: '⚔️' },
];

// Get status key for translations
function getStatusKey(status: number): string {
  switch (status) {
    case STATUS.OFFLINE: return 'offline';
    case STATUS.ONLINE: return 'online';
    case STATUS.STARTING: return 'starting';
    case STATUS.STOPPING: return 'stopping';
    case STATUS.RESTARTING: return 'restarting';
    case STATUS.SAVING: return 'saving';
    case STATUS.LOADING: return 'loading';
    case STATUS.CRASHED: return 'crashed';
    case STATUS.PENDING: return 'pending';
    case STATUS.PREPARING: return 'preparing';
    default: return 'unknown';
  }
}

// Get action type from status
function getActionFromStatus(status: number): 'start' | 'stop' | 'restart' | null {
  switch (status) {
    case STATUS.STARTING:
    case STATUS.LOADING:
    case STATUS.PREPARING:
    case STATUS.PENDING:
      return 'start';
    case STATUS.STOPPING:
    case STATUS.SAVING:
      return 'stop';
    case STATUS.RESTARTING:
      return 'restart';
    default:
      return null;
  }
}

// Get color scheme based on action
function getActionColors(action: 'start' | 'stop' | 'restart' | null) {
  switch (action) {
    case 'start':
      return {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-500/20',
        text: 'text-emerald-500',
        border: 'border-emerald-500/30',
        gradient: 'from-emerald-500 to-emerald-600',
      };
    case 'stop':
      return {
        bg: 'bg-red-500',
        bgLight: 'bg-red-500/20',
        text: 'text-red-500',
        border: 'border-red-500/30',
        gradient: 'from-red-500 to-red-600',
      };
    case 'restart':
      return {
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-500/20',
        text: 'text-amber-500',
        border: 'border-amber-500/30',
        gradient: 'from-amber-500 to-amber-600',
      };
    default:
      return {
        bg: 'bg-primary',
        bgLight: 'bg-primary/20',
        text: 'text-primary',
        border: 'border-primary/30',
        gradient: 'from-primary to-primary',
      };
  }
}

// Custom hook for progress simulation
function useProgressSimulation(
  status: number,
  isTransition: boolean,
  onComplete?: () => void
) {
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const lastStatusRef = useRef<number>(status);
  const wasTransitionRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if transitioning from transition to stable state (completed)
    if (wasTransitionRef.current && !isTransition) {
      // Animate to 100% then show completion
      setProgress(100);
      setIsCompleting(true);
      
      const completeTimer = setTimeout(() => {
        setIsCompleting(false);
        setProgress(0);
        if (onComplete) onComplete();
      }, 1500);
      
      return () => clearTimeout(completeTimer);
    }
    
    wasTransitionRef.current = isTransition;
    
    // Reset progress when status changes to a new transition
    if (status !== lastStatusRef.current) {
      lastStatusRef.current = status;
      startTimeRef.current = Date.now();
      setProgress(0);
      setIsCompleting(false);
    }

    if (!isTransition) {
      return;
    }

    // Simulate progress over time with smooth animation
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const seconds = elapsed / 1000;
      
      let newProgress = 0;
      
      // Different curves for different actions
      if (status === STATUS.STARTING || status === STATUS.PREPARING || status === STATUS.LOADING || status === STATUS.PENDING) {
        // Starting: slower, takes 30-90s typically
        if (seconds < 5) {
          newProgress = seconds * 4; // 0-20% fast start
        } else if (seconds < 20) {
          newProgress = 20 + (seconds - 5) * 2.5; // 20-57.5% steady
        } else if (seconds < 45) {
          newProgress = 57.5 + (seconds - 20) * 1.3; // 57.5-90% slower
        } else if (seconds < 90) {
          newProgress = 90 + (seconds - 45) * 0.2; // 90-99% very slow
        } else {
          newProgress = 99; // Cap at 99 until actually complete
        }
      } else if (status === STATUS.STOPPING || status === STATUS.SAVING) {
        // Stopping: faster, 5-30s typically
        if (seconds < 3) {
          newProgress = seconds * 15; // 0-45% fast
        } else if (seconds < 10) {
          newProgress = 45 + (seconds - 3) * 6; // 45-87% steady
        } else if (seconds < 25) {
          newProgress = 87 + (seconds - 10) * 0.8; // 87-99% slow
        } else {
          newProgress = 99;
        }
      } else if (status === STATUS.RESTARTING) {
        // Restart: combo of both
        if (seconds < 5) {
          newProgress = seconds * 6; // 0-30% (stopping phase)
        } else if (seconds < 15) {
          newProgress = 30 + (seconds - 5) * 3; // 30-60% (transition)
        } else if (seconds < 40) {
          newProgress = 60 + (seconds - 15) * 1.4; // 60-95% (starting)
        } else if (seconds < 70) {
          newProgress = 95 + (seconds - 40) * 0.13; // 95-99%
        } else {
          newProgress = 99;
        }
      } else {
        newProgress = Math.min(seconds * 2, 99);
      }

      setProgress(Math.min(Math.max(newProgress, 0), 99));
    }, 100);

    return () => clearInterval(interval);
  }, [status, isTransition, onComplete]);

  return { progress, isCompleting };
}

function ServerControls({
  serverStatus,
  actionLoading,
  sendingCommand,
  onAction,
  onSendCommand,
  isAdmin,
}: ServerControlsProps) {
  const tServers = useTranslations('servers');
  const tCommon = useTranslations('common');

  const [command, setCommand] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);

  const isOnline = serverStatus === STATUS.ONLINE;
  const isOffline = serverStatus === STATUS.OFFLINE || serverStatus === STATUS.CRASHED;
  const isTransition = TRANSITION_STATUSES.includes(serverStatus);
  const statusKey = getStatusKey(serverStatus);
  const currentAction = getActionFromStatus(serverStatus);
  const colors = getActionColors(currentAction);

  const handleComplete = useCallback(() => {
    setShowCompletion(true);
    setTimeout(() => setShowCompletion(false), 500);
  }, []);

  const { progress, isCompleting } = useProgressSimulation(
    serverStatus,
    isTransition,
    handleComplete
  );

  // Get waiting message based on current action
  const getWaitingMessage = () => {
    if (isCompleting) {
      return currentAction === 'start' 
        ? tServers('status.online')
        : currentAction === 'stop'
        ? tServers('status.offline')
        : tServers('status.online');
    }
    if (!currentAction) return '';
    try {
      return tServers(`commands.waitingMessages.${currentAction}`);
    } catch {
      return '';
    }
  };

  // Handle command submission
  const handleSendCommand = async () => {
    if (!command.trim() || sendingCommand) return;
    const success = await onSendCommand(command);
    if (success) {
      setCommand('');
    }
  };

  // Get button content based on action
  const getButtonContent = (action: 'start' | 'stop' | 'restart', isLoading: boolean) => {
    const icons = {
      start: <Power className="h-4 w-4" />,
      stop: <Square className="h-4 w-4" />,
      restart: <RotateCcw className="h-4 w-4" />,
    };
    const labels = {
      start: tServers('actions.start'),
      stop: tServers('actions.stop'),
      restart: tServers('actions.restart'),
    };

    return (
      <>
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <span className="mr-2">{icons[action]}</span>
        )}
        {labels[action]}
      </>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Settings className="h-4 w-4 text-purple-500" />
            </span>
            {tServers('commands.controls')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress section - only during transitions */}
        {(isTransition || isCompleting) && (
          <div className="space-y-3">
            {/* Progress bar with colored styling */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-medium", colors.text)}>
                  {isCompleting ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {getWaitingMessage()}
                    </span>
                  ) : (
                    tServers(`status.${statusKey}`)
                  )}
                </span>
                <span className={cn("text-sm font-mono", colors.text)}>
                  {Math.round(progress)}%
                </span>
              </div>
              
              {/* Progress bar container */}
              <div className={cn(
                "relative h-3 rounded-full overflow-hidden",
                colors.bgLight,
                "border",
                colors.border
              )}>
                {/* Progress fill */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out",
                    `bg-gradient-to-r ${colors.gradient}`,
                    isCompleting && "animate-pulse"
                  )}
                  style={{ width: `${progress}%` }}
                />
                
                {/* Shimmer effect during progress */}
                {!isCompleting && progress < 100 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                )}
              </div>
            </div>

            {/* Waiting message */}
            {!isCompleting && (
              <p className="text-xs text-muted-foreground text-center">
                {getWaitingMessage()}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Start button - show when offline */}
          {isOffline && !isCompleting && (
            <Button
              onClick={() => onAction('start')}
              disabled={actionLoading !== null}
              className={cn(
                "w-full",
                "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {getButtonContent('start', actionLoading === 'start')}
            </Button>
          )}

          {/* Stop button - show when online */}
          {isOnline && !isCompleting && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={actionLoading !== null}
                >
                  {getButtonContent('stop', actionLoading === 'stop')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tServers('commands.stopConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tServers('commands.stopConfirmDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onAction('stop')}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {tCommon('confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Restart button - show when online */}
          {isOnline && !isCompleting && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"
                  disabled={actionLoading !== null}
                >
                  {getButtonContent('restart', actionLoading === 'restart')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tServers('commands.restartConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tServers('commands.restartConfirmDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onAction('restart')}
                    className="bg-amber-600 text-white hover:bg-amber-700"
                  >
                    {tCommon('confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* During transitions, show status button with matching color */}
          {isTransition && !isCompleting && (
            <Button 
              disabled 
              className={cn(
                "w-full",
                currentAction === 'start' && "bg-emerald-600/50 text-emerald-100",
                currentAction === 'stop' && "bg-red-600/50 text-red-100",
                currentAction === 'restart' && "bg-amber-600/50 text-amber-100",
              )}
            >
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {tServers(`status.${statusKey}`)}
            </Button>
          )}

          {/* Completion animation button */}
          {isCompleting && (
            <Button
              disabled
              className={cn(
                "w-full transition-all duration-500",
                currentAction === 'start' && "bg-emerald-600 text-white",
                currentAction === 'stop' && "bg-red-600 text-white",
                currentAction === 'restart' && "bg-emerald-600 text-white",
              )}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 animate-bounce" />
              {currentAction === 'start' ? tServers('status.online') : 
               currentAction === 'stop' ? tServers('status.offline') :
               tServers('status.online')}
            </Button>
          )}
        </div>

        {/* Command input section - only for admins when online */}
        {isAdmin && isOnline && !isTransition && !isCompleting && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-cyan-500/10">
                <Terminal className="h-4 w-4 text-cyan-500" />
              </div>
              <span className="text-sm font-medium">{tServers('commands.sendCommand')}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Admin
              </Badge>
            </div>

            {/* Quick commands grid */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                {tServers('commands.quickCommands')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {QUICK_COMMANDS.map((cmd) => (
                  <TooltipProvider key={cmd.value}>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 text-xs justify-start gap-1.5 px-2",
                            "hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-600 dark:hover:text-cyan-400",
                            "transition-all duration-200"
                          )}
                          onClick={() => setCommand(cmd.value)}
                        >
                          <span>{cmd.icon}</span>
                          <span className="truncate">{tServers(`commands.quickCommandsList.${cmd.labelKey}`)}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="font-mono text-xs">
                        /{cmd.value}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            
            {/* Command input */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm select-none">
                  /
                </div>
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder={tServers('commands.commandInput.placeholder')}
                  disabled={sendingCommand}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !sendingCommand && command.trim()) {
                      handleSendCommand();
                    }
                  }}
                  className={cn(
                    "pl-7 pr-24 font-mono text-sm h-11",
                    "focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500/50",
                    sendingCommand && "opacity-50"
                  )}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <Button
                    onClick={handleSendCommand}
                    disabled={!command.trim() || sendingCommand}
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 px-3",
                      "bg-cyan-600 hover:bg-cyan-700 text-white",
                      "disabled:opacity-50"
                    )}
                  >
                    {sendingCommand ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="hidden sm:inline">{tServers('commands.commandInput.sending')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{tServers('commands.commandInput.send')}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {tServers('commands.commandInput.hint')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Named export for compatibility with existing imports
export { ServerControls };
export default ServerControls;
