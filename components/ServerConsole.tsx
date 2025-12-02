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
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface ConsoleLine {
  id: string;
  line: string;
  timestamp: string;
  type: 'log' | 'info' | 'warning' | 'error' | 'command';
}

interface ServerConsoleProps {
  serverId: string;
  serverName: string;
  serverStatus: number;
  isAdmin: boolean;
}

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
  
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lineIdCounter = useRef(0);
  const historyDropdownRef = useRef<HTMLDivElement>(null);

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

  // Connect to console stream
  const connect = useCallback(async () => {
    if (!isAdmin || serverStatus !== 1) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        setError(tCommon('notAuthenticated'));
        setIsConnecting(false);
        return;
      }

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(
        `/api/servers/${serverId}/console?token=${encodeURIComponent(token)}`
      );

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        addLine(t('system'), t('connectedToServer'), 'info');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              addLine(t('system'), t('connectedTo', { serverName: data.serverName }), 'info');
              break;
            case 'console':
              addLine('', data.line, classifyLine(data.line));
              break;
            case 'status':
              if (data.status !== 1) {
                addLine(t('system'), t('serverWentOffline'), 'warning');
              }
              break;
            case 'info':
              addLine(t('system'), data.message, 'info');
              break;
          }
        } catch (err) {
          console.error('Error parsing console message:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setIsConnecting(false);
        if (eventSource.readyState === EventSource.CLOSED) {
          addLine(t('system'), t('connectionLost'), 'warning');
        }
      };

      eventSourceRef.current = eventSource;
    } catch {
      setError(t('connectionError'));
      setIsConnecting(false);
    }
  }, [serverId, serverStatus, isAdmin, t, tCommon]);

  // Disconnect from console stream
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    addLine(t('system'), t('disconnectedFromConsole'), 'info');
  }, [t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Auto-connect when server comes online
  useEffect(() => {
    if (serverStatus === 1 && isAdmin && !isConnected && !isConnecting) {
      const timer = setTimeout(() => {
        connect();
      }, 2000);
      return () => clearTimeout(timer);
    } else if (serverStatus !== 1 && isConnected) {
      disconnect();
    }
  }, [serverStatus, isAdmin, isConnected, isConnecting, connect, disconnect]);

  // Add a line to console
  const addLine = (prefix: string, text: string, type: ConsoleLine['type']) => {
    const newLine: ConsoleLine = {
      id: `line-${lineIdCounter.current++}`,
      line: prefix ? `[${prefix}] ${text}` : text,
      timestamp: new Date().toISOString(),
      type,
    };
    setLines(prev => [...prev.slice(-500), newLine]);
  };

  // Classify log line type
  const classifyLine = (line: string): ConsoleLine['type'] => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('exception') || lowerLine.includes('failed')) {
      return 'error';
    }
    if (lowerLine.includes('warn')) {
      return 'warning';
    }
    if (lowerLine.includes('info')) {
      return 'info';
    }
    return 'log';
  };

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

  // Send command to server
  const sendCommand = async (cmdToSend?: string) => {
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

      const response = await fetch(`/api/servers/${serverId}/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: cmd }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        addLine(tCommon('error'), data.error || (locale === 'pt-BR' ? 'Falha ao executar comando' : 'Failed to execute command'), 'error');
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
      sendCommand();
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
    addLine(t('system'), t('consoleCleared'), 'info');
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

  // Get line styles
  const getLineStyles = (type: ConsoleLine['type']) => {
    const baseStyles = 'leading-relaxed font-mono text-[13px] px-2 py-0.5 rounded group hover:bg-white/5 transition-colors';
    switch (type) {
      case 'error':
        return cn(baseStyles, 'text-red-400 bg-red-500/5 border-l-2 border-red-500/50');
      case 'warning':
        return cn(baseStyles, 'text-amber-400 bg-amber-500/5 border-l-2 border-amber-500/50');
      case 'info':
        return cn(baseStyles, 'text-blue-400');
      case 'command':
        return cn(baseStyles, 'text-emerald-400 font-semibold bg-emerald-500/10 border-l-2 border-emerald-500');
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
              isExpanded ? 'h-[calc(100vh-320px)]' : 'h-72'
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
              <div className="p-2 space-y-0.5">
                {filteredLines.map((line) => (
                  <div key={line.id} className={cn(getLineStyles(line.type), 'relative')}>
                    <span className="text-gray-600 text-[11px] mr-2 font-normal">
                      {new Date(line.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="break-all">{line.line}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyLine(line.line, line.id)}
                    >
                      {copiedLine === line.id ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
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
                          sendCommand(qc.cmd);
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
              onClick={() => sendCommand()}
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
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
