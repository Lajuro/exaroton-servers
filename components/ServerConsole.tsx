'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Terminal,
  Send,
  Trash2,
  Download,
  Pause,
  Play,
  Maximize2,
  Minimize2,
  Loader2,
  WifiOff,
  Wifi,
  AlertCircle,
  Info,
  ChevronUp,
  ChevronDown,
  History,
  Zap,
  Search,
  X,
  Copy,
  Check,
  LogIn,
  LogOut,
  MessageSquare,
  AlertTriangle,
  XCircle,
  Server,
  Skull,
  Shield,
  Award,
  Sparkles,
  Clock,
  MousePointerClick,
} from 'lucide-react';
import { PlayerActionMenu } from '@/components/PlayerActionMenu';
import { useTranslations, useLocale } from 'next-intl';
import { sendServerCommand } from '@/lib/useServerCommand';

// Enhanced log types for Minecraft server events
type LogType = 
  | 'log'
  | 'info'
  | 'warning'
  | 'error'
  | 'command'
  | 'player_join'
  | 'player_leave'
  | 'player_death'
  | 'chat'
  | 'achievement'
  | 'server_start'
  | 'server_stop'
  | 'plugin'
  | 'world'
  | 'system';

interface ConsoleLine {
  id: string;
  line: string;
  rawLine: string;
  timestamp: string;
  type: LogType;
  player?: string;
  message?: string;
}

interface ServerConsoleProps {
  serverId: string;
  serverName: string;
  serverStatus: number;
  isAdmin: boolean;
}

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;

export function ServerConsole({ serverId, serverName, serverStatus, isAdmin }: ServerConsoleProps) {
  const t = useTranslations('servers.console');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [command, setCommand] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sendingCommand, setSendingCommand] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [copiedLine, setCopiedLine] = useState<string | null>(null);
  const [commandSuccess, setCommandSuccess] = useState<boolean | null>(null);
  
  // Player action menu state
  const [playerActionMenuOpen, setPlayerActionMenuOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedPlayerMessage, setSelectedPlayerMessage] = useState<string | undefined>(undefined);
  
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lineIdCounter = useRef(0);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const hasManuallyDisconnectedRef = useRef(false);

  // Quick commands for Minecraft servers
  const quickCommands = useMemo(() => [
    { label: 'say', cmd: 'say ', description: locale === 'pt-BR' ? 'Enviar mensagem' : 'Send message' },
    { label: 'list', cmd: 'list', description: locale === 'pt-BR' ? 'Listar jogadores' : 'List players' },
    { label: 'time', cmd: 'time set day', description: locale === 'pt-BR' ? 'Definir dia' : 'Set day' },
    { label: 'weather', cmd: 'weather clear', description: locale === 'pt-BR' ? 'Limpar tempo' : 'Clear weather' },
    { label: 'save', cmd: 'save-all', description: locale === 'pt-BR' ? 'Salvar mundo' : 'Save world' },
    { label: 'stop', cmd: 'stop', description: locale === 'pt-BR' ? 'Parar servidor' : 'Stop server' },
  ], [locale]);

  // Filtered lines based on search
  const filteredLines = useMemo(() => {
    if (!searchQuery.trim()) return lines;
    const query = searchQuery.toLowerCase();
    return lines.filter(line => line.line.toLowerCase().includes(query));
  }, [lines, searchQuery]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (consoleRef.current && !isPaused) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [isPaused]);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  // Close history dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts for console
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input (except for the console input)
      const target = e.target as HTMLElement;
      const isConsoleInput = target === inputRef.current;
      const isOtherInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Ctrl+L or Cmd+L to clear console
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !isOtherInput) {
        e.preventDefault();
        clearConsole();
        return;
      }
      
      // Ctrl+K or Cmd+K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      
      // Escape to minimize when expanded, or close search
      if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
          return;
        }
        if (isExpanded) {
          setIsExpanded(false);
          return;
        }
      }
      
      // Ctrl+F or Cmd+F to toggle search (only when console is focused or expanded)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && (isConsoleInput || isExpanded)) {
        e.preventDefault();
        setShowSearch(prev => !prev);
        return;
      }
      
      // Ctrl+D or Cmd+D to download logs (when console is focused)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && isConsoleInput && lines.length > 0) {
        e.preventDefault();
        downloadLogs();
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [isExpanded, showSearch, lines.length]);

  // Classify log line type with advanced Minecraft log parsing
  const classifyLine = useCallback((line: string): { type: LogType; player?: string; message?: string } => {
    const lowerLine = line.toLowerCase();
    
    // Player join patterns
    // [Server thread/INFO]: Player123 joined the game
    // [Server thread/INFO]: Player123[/IP:PORT] logged in with entity id
    const joinPatterns = [
      /(\w+) joined the game/i,
      /(\w+)\[\/[\d.:]+\] logged in/i,
      /UUID of player (\w+) is/i,
    ];
    for (const pattern of joinPatterns) {
      const match = line.match(pattern);
      if (match) {
        return { type: 'player_join', player: match[1] };
      }
    }
    
    // Player leave patterns
    // [Server thread/INFO]: Player123 left the game
    // [Server thread/INFO]: Player123 lost connection: Disconnected
    const leavePatterns = [
      /(\w+) left the game/i,
      /(\w+) lost connection/i,
      /(\w+) has disconnected/i,
    ];
    for (const pattern of leavePatterns) {
      const match = line.match(pattern);
      if (match) {
        return { type: 'player_leave', player: match[1] };
      }
    }
    
    // Player death patterns
    // [Server thread/INFO]: Player123 was slain by Zombie
    // [Server thread/INFO]: Player123 fell from a high place
    const deathPatterns = [
      /(\w+) was slain by/i,
      /(\w+) was killed by/i,
      /(\w+) was shot by/i,
      /(\w+) drowned/i,
      /(\w+) fell from/i,
      /(\w+) fell out of the world/i,
      /(\w+) hit the ground too hard/i,
      /(\w+) burned to death/i,
      /(\w+) went up in flames/i,
      /(\w+) tried to swim in lava/i,
      /(\w+) suffocated in a wall/i,
      /(\w+) starved to death/i,
      /(\w+) was pricked to death/i,
      /(\w+) blew up/i,
      /(\w+) was blown up/i,
      /(\w+) withered away/i,
      /(\w+) was pummeled/i,
      /(\w+) died/i,
    ];
    for (const pattern of deathPatterns) {
      const match = line.match(pattern);
      if (match) {
        return { type: 'player_death', player: match[1], message: line };
      }
    }
    
    // Chat messages
    // <Player123> Hello everyone!
    const chatMatch = line.match(/<(\w+)>\s*(.+)/);
    if (chatMatch) {
      return { type: 'chat', player: chatMatch[1], message: chatMatch[2] };
    }
    
    // Achievement/Advancement patterns
    // [Server thread/INFO]: Player123 has made the advancement [Getting Wood]
    // [Server thread/INFO]: Player123 has completed the challenge [Return to Sender]
    const achievementPatterns = [
      /(\w+) has made the advancement/i,
      /(\w+) has completed the challenge/i,
      /(\w+) has reached the goal/i,
      /(\w+) earned the achievement/i,
    ];
    for (const pattern of achievementPatterns) {
      const match = line.match(pattern);
      if (match) {
        return { type: 'achievement', player: match[1], message: line };
      }
    }
    
    // Server start/stop patterns
    if (lowerLine.includes('done') && lowerLine.includes('for help')) {
      return { type: 'server_start' };
    }
    if (lowerLine.includes('stopping the server') || lowerLine.includes('stopping server')) {
      return { type: 'server_stop' };
    }
    if (lowerLine.includes('starting minecraft server')) {
      return { type: 'server_start' };
    }
    
    // Plugin loading patterns
    if (lowerLine.includes('[plugin]') || lowerLine.includes('loading plugin') || lowerLine.includes('enabling plugin')) {
      return { type: 'plugin' };
    }
    
    // World loading patterns
    if (lowerLine.includes('preparing level') || lowerLine.includes('preparing spawn') || lowerLine.includes('loading world')) {
      return { type: 'world' };
    }
    
    // Error patterns
    if (lowerLine.includes('error') || lowerLine.includes('exception') || lowerLine.includes('failed') || lowerLine.includes('cannot')) {
      return { type: 'error' };
    }
    
    // Warning patterns
    if (lowerLine.includes('warn') || lowerLine.includes('can\'t keep up')) {
      return { type: 'warning' };
    }
    
    // Info patterns
    if (lowerLine.includes('/info]') || lowerLine.includes('[info]')) {
      return { type: 'info' };
    }
    
    return { type: 'log' };
  }, []);

  // Add a line to console (defined before connect to avoid hoisting issues)
  const addLine = useCallback((prefix: string, text: string, type: LogType, extra?: { player?: string; message?: string }) => {
    const newLine: ConsoleLine = {
      id: `line-${lineIdCounter.current++}`,
      line: prefix ? `[${prefix}] ${text}` : text,
      rawLine: text,
      timestamp: new Date().toISOString(),
      type,
      player: extra?.player,
      message: extra?.message,
    };
    setLines(prev => [...prev.slice(-500), newLine]);
  }, []);

  // Add a raw console line with automatic classification
  const addConsoleLine = useCallback((rawLine: string) => {
    const classified = classifyLine(rawLine);
    const newLine: ConsoleLine = {
      id: `line-${lineIdCounter.current++}`,
      line: rawLine,
      rawLine: rawLine,
      timestamp: new Date().toISOString(),
      type: classified.type,
      player: classified.player,
      message: classified.message,
    };
    setLines(prev => [...prev.slice(-500), newLine]);
  }, [classifyLine]);

  // Cleanup function for SSE connection
  const cleanupSSE = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Connect to console stream
  const connect = useCallback(async () => {
    if (!isAdmin || serverStatus !== 1 || isUnmountedRef.current) return;
    
    // Don't reconnect if manually disconnected
    if (hasManuallyDisconnectedRef.current) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token || isUnmountedRef.current) {
        setError(tCommon('notAuthenticated'));
        setIsConnecting(false);
        return;
      }

      // Clean up existing connection
      cleanupSSE();

      const eventSource = new EventSource(
        `/api/servers/${serverId}/console?token=${encodeURIComponent(token)}`
      );

      eventSource.onopen = () => {
        if (isUnmountedRef.current) {
          eventSource.close();
          return;
        }
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        addLine(t('system'), t('connectedToServer'), 'system');
      };

      eventSource.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log('[Console SSE Frontend] Received:', data.type, data);
          
          switch (data.type) {
            case 'connected':
              addLine(t('system'), t('connectedTo', { serverName: data.serverName }), 'system');
              break;
            case 'console':
              // Use the advanced classification for console lines
              if (data.line) {
                console.log('[Console SSE Frontend] Processing line:', data.line.substring(0, 80));
                addConsoleLine(data.line);
              }
              break;
            case 'status':
              if (data.status !== 1) {
                addLine(t('system'), t('serverWentOffline'), 'warning');
              }
              break;
            case 'info':
              addLine(t('system'), data.message, 'system');
              break;
          }
        } catch (err) {
          console.error('Error parsing console message:', err);
        }
      };

      eventSource.onerror = () => {
        if (isUnmountedRef.current) {
          eventSource.close();
          return;
        }
        
        setIsConnected(false);
        setIsConnecting(false);
        eventSource.close();
        eventSourceRef.current = null;
        
        if (eventSource.readyState === EventSource.CLOSED) {
          addLine(t('system'), t('connectionLost'), 'warning');
        }
        
        // Only attempt reconnection if not manually disconnected and under max attempts
        if (!hasManuallyDisconnectedRef.current && 
            reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && 
            serverStatus === 1) {
          reconnectAttemptsRef.current++;
          console.log(`[Console SSE] Reconnecting (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current && !hasManuallyDisconnectedRef.current) {
              connect();
            }
          }, RECONNECT_DELAY);
        }
      };

      eventSourceRef.current = eventSource;
    } catch {
      setError(t('connectionError'));
      setIsConnecting(false);
    }
  }, [serverId, serverStatus, isAdmin, t, tCommon, cleanupSSE, addLine, addConsoleLine]);

  // Disconnect from console stream
  const disconnect = useCallback(() => {
    hasManuallyDisconnectedRef.current = true;
    cleanupSSE();
    setIsConnected(false);
    addLine(t('system'), t('disconnectedFromConsole'), 'system');
  }, [t, cleanupSSE, addLine]);

  // Cleanup on unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    
    return () => {
      isUnmountedRef.current = true;
      cleanupSSE();
    };
  }, [cleanupSSE]);

  // Handle server status changes
  useEffect(() => {
    // Reset manual disconnect flag when server goes offline
    if (serverStatus !== 1) {
      hasManuallyDisconnectedRef.current = false;
      if (isConnected) {
        disconnect();
      }
    }
  }, [serverStatus, isConnected, disconnect]);

  // Copy line to clipboard
  const copyLine = async (line: string, id: string) => {
    try {
      await navigator.clipboard.writeText(line);
      setCopiedLine(id);
      setTimeout(() => setCopiedLine(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle player action menu command execution
  const executePlayerCommand = useCallback(async (cmd: string): Promise<void> => {
    if (!cmd || !isAdmin) return;

    setSendingCommand(true);
    addLine(t('command'), cmd, 'command');

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        addLine(tCommon('error'), tCommon('notAuthenticated'), 'error');
        return;
      }

      const result = await sendServerCommand({
        serverId,
        command: cmd,
        token,
      });

      if (!result.success) {
        addLine(tCommon('error'), result.error || (locale === 'pt-BR' ? 'Falha ao executar comando' : 'Failed to execute command'), 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      throw error;
    } finally {
      setSendingCommand(false);
    }
  }, [isAdmin, serverId, locale, addLine, t, tCommon]);

  // Open player action menu
  const openPlayerActionMenu = useCallback((playerName: string, message?: string) => {
    if (!isAdmin || serverStatus !== 1) return;
    setSelectedPlayer(playerName);
    setSelectedPlayerMessage(message);
    setPlayerActionMenuOpen(true);
  }, [isAdmin, serverStatus]);

  // Send command to server using centralized function
  const sendCommandToServer = async (cmdToSend?: string) => {
    const cmd = cmdToSend || command.trim();
    if (!cmd || sendingCommand || !isAdmin) return;

    setSendingCommand(true);
    setCommandSuccess(null);
    if (!cmdToSend) setCommand('');

    // Add to history
    setCommandHistory(prev => [...prev.filter(c => c !== cmd), cmd].slice(-50));
    setHistoryIndex(-1);

    // Show command in console
    addLine(t('command'), cmd, 'command');

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        addLine(tCommon('error'), tCommon('notAuthenticated'), 'error');
        setSendingCommand(false);
        setCommandSuccess(false);
        return;
      }

      // Use centralized sendServerCommand function
      const result = await sendServerCommand({
        serverId,
        command: cmd,
        token,
      });

      if (!result.success) {
        addLine(tCommon('error'), result.error || (locale === 'pt-BR' ? 'Falha ao executar comando' : 'Failed to execute command'), 'error');
        setCommandSuccess(false);
      } else {
        setCommandSuccess(true);
      }
    } catch {
      addLine(tCommon('error'), locale === 'pt-BR' ? 'Erro de conexão' : 'Connection error', 'error');
      setCommandSuccess(false);
    } finally {
      setSendingCommand(false);
      inputRef.current?.focus();
      // Reset success status after 2 seconds
      setTimeout(() => setCommandSuccess(null), 2000);
    }
  };

  // Handle key press in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendCommandToServer();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Escape') {
      setShowHistoryDropdown(false);
    }
  };

  // Clear console
  const clearConsole = () => {
    setLines([]);
    addLine(t('system'), t('consoleCleared'), 'system');
  };

  // Download logs
  const downloadLogs = () => {
    const content = lines.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.line}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-${serverName}-${new Date().toISOString().split('T')[0]}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get icon for log type
  const getLogIcon = (type: LogType) => {
    const iconClass = 'h-3.5 w-3.5 flex-shrink-0';
    switch (type) {
      case 'player_join':
        return <LogIn className={cn(iconClass, 'text-green-400')} />;
      case 'player_leave':
        return <LogOut className={cn(iconClass, 'text-red-400')} />;
      case 'player_death':
        return <Skull className={cn(iconClass, 'text-red-500')} />;
      case 'chat':
        return <MessageSquare className={cn(iconClass, 'text-blue-400')} />;
      case 'achievement':
        return <Award className={cn(iconClass, 'text-yellow-400')} />;
      case 'server_start':
        return <Sparkles className={cn(iconClass, 'text-green-500')} />;
      case 'server_stop':
        return <XCircle className={cn(iconClass, 'text-red-500')} />;
      case 'plugin':
        return <Shield className={cn(iconClass, 'text-purple-400')} />;
      case 'world':
        return <Server className={cn(iconClass, 'text-cyan-400')} />;
      case 'error':
        return <XCircle className={cn(iconClass, 'text-red-400')} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, 'text-amber-400')} />;
      case 'command':
        return <Terminal className={cn(iconClass, 'text-emerald-400')} />;
      case 'system':
        return <Info className={cn(iconClass, 'text-blue-400')} />;
      case 'info':
        return <Info className={cn(iconClass, 'text-blue-400')} />;
      default:
        return <Clock className={cn(iconClass, 'text-gray-500')} />;
    }
  };

  // Get line styles
  const getLineStyles = (type: LogType) => {
    const baseStyles = 'leading-relaxed font-mono text-[13px] px-3 py-1.5 rounded-md group hover:bg-white/5 transition-colors flex items-start gap-2';
    switch (type) {
      case 'player_join':
        return cn(baseStyles, 'text-green-400 bg-green-500/5 border-l-2 border-green-500');
      case 'player_leave':
        return cn(baseStyles, 'text-red-400 bg-red-500/5 border-l-2 border-red-500/70');
      case 'player_death':
        return cn(baseStyles, 'text-red-300 bg-red-900/20 border-l-2 border-red-700');
      case 'chat':
        return cn(baseStyles, 'text-blue-300 bg-blue-500/5 border-l-2 border-blue-500');
      case 'achievement':
        return cn(baseStyles, 'text-yellow-300 bg-yellow-500/10 border-l-2 border-yellow-500');
      case 'server_start':
        return cn(baseStyles, 'text-green-300 bg-green-500/10 border-l-2 border-green-600 font-semibold');
      case 'server_stop':
        return cn(baseStyles, 'text-red-300 bg-red-500/10 border-l-2 border-red-600 font-semibold');
      case 'plugin':
        return cn(baseStyles, 'text-purple-400 bg-purple-500/5 border-l-2 border-purple-500/50');
      case 'world':
        return cn(baseStyles, 'text-cyan-400 bg-cyan-500/5 border-l-2 border-cyan-500/50');
      case 'error':
        return cn(baseStyles, 'text-red-400 bg-red-500/10 border-l-2 border-red-500');
      case 'warning':
        return cn(baseStyles, 'text-amber-400 bg-amber-500/5 border-l-2 border-amber-500/50');
      case 'command':
        return cn(baseStyles, 'text-emerald-400 font-semibold bg-emerald-500/10 border-l-2 border-emerald-500');
      case 'system':
        return cn(baseStyles, 'text-blue-400 bg-blue-500/5 border-l-2 border-blue-500/50 italic');
      case 'info':
        return cn(baseStyles, 'text-blue-400');
      default:
        return cn(baseStyles, 'text-gray-300');
    }
  };

  if (!isAdmin) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/30 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{t('adminOnly')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn(
        'transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden',
        isExpanded && 'fixed inset-4 z-50 border-primary/30 shadow-2xl'
      )}>
        {/* Header */}
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="relative">
                <Terminal className="h-5 w-5 text-primary" />
                {isConnected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <span>{t('title')}</span>
              <Badge 
                variant="outline" 
                className={cn(
                  'gap-1.5 transition-all',
                  isConnected 
                    ? 'text-green-400 border-green-500/30 bg-green-500/10' 
                    : 'text-muted-foreground border-muted-foreground/30'
                )}
              >
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? t('connected') : t('disconnected')}
              </Badge>
            </CardTitle>
            
            {/* Toolbar */}
            <div className="flex items-center gap-1">
              {/* Search toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", showSearch && "bg-primary/20 text-primary")}
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{locale === 'pt-BR' ? 'Buscar' : 'Search'}</TooltipContent>
              </Tooltip>
              
              {/* Pause/Resume */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", isPaused && "bg-yellow-500/20 text-yellow-400")}
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPaused ? t('resumeAutoScroll') : t('pauseAutoScroll')}</TooltipContent>
              </Tooltip>
              
              {/* Clear */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-red-400"
                    onClick={clearConsole}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('clearConsole')}</TooltipContent>
              </Tooltip>
              
              {/* Download */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={downloadLogs}
                    disabled={lines.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('downloadLogs')}</TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Expand/Collapse */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isExpanded ? t('minimize') : t('expand')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* Search bar */}
          {showSearch && (
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'pt-BR' ? 'Buscar nos logs...' : 'Search logs...'}
                className="pl-9 pr-9 bg-black/30 border-white/10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {searchQuery && (
                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {filteredLines.length} {locale === 'pt-BR' ? 'resultados' : 'results'}
                </span>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-3 p-4">
          {/* Server offline message */}
          {serverStatus !== 1 && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-400 border border-yellow-500/20">
              <Info className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{t('serverOfflineMessage')}</span>
            </div>
          )}

          {/* Connect button */}
          {serverStatus === 1 && !isConnected && (
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/20"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('connecting')}
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-5 w-5" />
                  {t('connectToConsole')}
                </>
              )}
            </Button>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Console output */}
          <div
            ref={consoleRef}
            className={cn(
              'bg-gray-950 rounded-lg overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
              'border border-white/5 shadow-inner',
              isExpanded ? 'h-[calc(100vh-320px)]' : 'h-80'
            )}
          >
            {filteredLines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                <Terminal className="h-8 w-8 opacity-30" />
                <span className="text-sm">
                  {isConnected ? t('waitingForLogs') : t('emptyConsole')}
                </span>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredLines.map((line) => {
                  const isClickable = isAdmin && serverStatus === 1 && line.player;
                  
                  return (
                    <div 
                      key={line.id} 
                      className={cn(
                        getLineStyles(line.type), 
                        'relative pr-10',
                        isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary/40 hover:bg-primary/5 transition-all'
                      )}
                      onClick={isClickable ? () => openPlayerActionMenu(line.player!, line.message || line.line) : undefined}
                    >
                      {/* Icon */}
                      {getLogIcon(line.type)}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-600 text-[10px] font-normal tabular-nums">
                            {new Date(line.timestamp).toLocaleTimeString()}
                          </span>
                          
                          {/* Player badge for player events - now clickable */}
                          {line.player && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      'text-[10px] px-1.5 py-0 h-4 font-medium transition-all',
                                      line.type === 'player_join' && 'border-green-500/50 text-green-400 bg-green-500/10',
                                      line.type === 'player_leave' && 'border-red-500/50 text-red-400 bg-red-500/10',
                                      line.type === 'player_death' && 'border-red-700/50 text-red-300 bg-red-900/20',
                                      line.type === 'chat' && 'border-blue-500/50 text-blue-400 bg-blue-500/10',
                                      line.type === 'achievement' && 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
                                      isClickable && 'hover:scale-105 hover:shadow-lg'
                                    )}
                                  >
                                    {isClickable && <MousePointerClick className="h-2.5 w-2.5 mr-0.5" />}
                                    {line.player}
                                  </Badge>
                                </TooltipTrigger>
                                {isClickable && (
                                  <TooltipContent side="top" className="text-xs">
                                    {locale === 'pt-BR' ? 'Clique para ações do jogador' : 'Click for player actions'}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        
                        {/* Log message */}
                        <span className="break-all block mt-0.5">{line.line}</span>
                      </div>
                      
                      {/* Copy button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLine(line.line, line.id);
                        }}
                      >
                        {copiedLine === line.id ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paused indicator */}
          {isPaused && (
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 rounded-lg py-2 border border-yellow-500/20">
              <Pause className="h-4 w-4" />
              {t('autoScrollPaused')}
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Quick commands */}
          {isConnected && serverStatus === 1 && (
            <div className="flex flex-wrap gap-2">
              {quickCommands.map((qc) => (
                <Tooltip key={qc.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-gray-900/50 border-white/10 hover:bg-primary/20 hover:border-primary/30 hover:text-primary"
                      onClick={() => {
                        if (qc.cmd.endsWith(' ')) {
                          setCommand(qc.cmd);
                          inputRef.current?.focus();
                        } else {
                          sendCommandToServer(qc.cmd);
                        }
                      }}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {qc.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{qc.description}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Command input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              {/* History dropdown */}
              {showHistoryDropdown && commandHistory.length > 0 && (
                <div 
                  ref={historyDropdownRef}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10"
                >
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-white/10 flex items-center gap-2">
                    <History className="h-3 w-3" />
                    {t('commandHistory')}
                  </div>
                  <div className="max-h-40 overflow-auto">
                    {[...commandHistory].reverse().map((cmd, idx) => (
                      <button
                        key={idx}
                        className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-primary/20 transition-colors flex items-center gap-2"
                        onClick={() => {
                          setCommand(cmd);
                          setShowHistoryDropdown(false);
                          inputRef.current?.focus();
                        }}
                      >
                        <ChevronUp className="h-3 w-3 text-muted-foreground" />
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono font-bold">
                {'>'}
              </div>
              <Input
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => commandHistory.length > 0 && setShowHistoryDropdown(true)}
                placeholder={serverStatus === 1 ? t('typeCommand') : t('serverOffline')}
                className={cn(
                  'pl-8 pr-20 font-mono bg-gray-900 border-white/10 focus:border-primary/50 transition-all',
                  commandSuccess === true && 'border-green-500/50 ring-1 ring-green-500/20',
                  commandSuccess === false && 'border-red-500/50 ring-1 ring-red-500/20'
                )}
                disabled={!isConnected || serverStatus !== 1 || sendingCommand}
              />
              
              {/* History toggle */}
              {commandHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                >
                  {showHistoryDropdown ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            <Button
              onClick={() => sendCommandToServer()}
              disabled={!isConnected || serverStatus !== 1 || sendingCommand || !command.trim()}
              className={cn(
                'min-w-[60px] transition-all',
                commandSuccess === true && 'bg-green-600 hover:bg-green-700',
                commandSuccess === false && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {sendingCommand ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : commandSuccess === true ? (
                <Check className="h-4 w-4" />
              ) : commandSuccess === false ? (
                <X className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Terminal className="h-3 w-3" />
            {t('historyHint', { lines: lines.length })}
            <span className="ml-auto text-[10px] opacity-60 hidden sm:flex items-center gap-3">
              <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-[9px]">Ctrl+L</kbd> {locale === 'pt-BR' ? 'limpar' : 'clear'}</span>
              <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-[9px]">Ctrl+K</kbd> {locale === 'pt-BR' ? 'focar' : 'focus'}</span>
              <span><kbd className="px-1 py-0.5 bg-gray-800 rounded text-[9px]">Ctrl+F</kbd> {locale === 'pt-BR' ? 'buscar' : 'search'}</span>
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Player Action Menu */}
      <PlayerActionMenu
        isOpen={playerActionMenuOpen}
        onClose={() => {
          setPlayerActionMenuOpen(false);
          setSelectedPlayer('');
          setSelectedPlayerMessage(undefined);
        }}
        playerName={selectedPlayer}
        onExecuteCommand={executePlayerCommand}
        recentMessage={selectedPlayerMessage}
      />
    </TooltipProvider>
  );
}
