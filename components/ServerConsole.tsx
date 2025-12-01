'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lineIdCounter = useRef(0);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (consoleRef.current && !isPaused) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [isPaused]);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

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
    } catch (err) {
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
      // Small delay to let server stabilize
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
    setLines(prev => [...prev.slice(-500), newLine]); // Keep last 500 lines
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

  // Send command to server
  const sendCommand = async () => {
    if (!command.trim() || sendingCommand || !isAdmin) return;

    setSendingCommand(true);
    const cmd = command.trim();
    setCommand('');

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
      }
    } catch (err) {
      addLine(tCommon('error'), locale === 'pt-BR' ? 'Erro de conexão' : 'Connection error', 'error');
    } finally {
      setSendingCommand(false);
      inputRef.current?.focus();
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

  // Get line color
  const getLineColor = (type: ConsoleLine['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'command':
        return 'text-green-400 font-semibold';
      default:
        return 'text-gray-300';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{t('adminOnly')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-300',
      isExpanded && 'fixed inset-4 z-50'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5" />
            {t('title')}
            {isConnected ? (
              <Badge variant="outline" className="ml-2 gap-1 text-green-500 border-green-500/30">
                <Wifi className="h-3 w-3" />
                {t('connected')}
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 gap-1 text-muted-foreground">
                <WifiOff className="h-3 w-3" />
                {t('disconnected')}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? t('resumeAutoScroll') : t('pauseAutoScroll')}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearConsole}
              title={t('clearConsole')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={downloadLogs}
              title={t('downloadLogs')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? t('minimize') : t('expand')}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Server offline message */}
        {serverStatus !== 1 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              {t('serverOfflineMessage')}
            </span>
          </div>
        )}

        {/* Connect button */}
        {serverStatus === 1 && !isConnected && (
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('connecting')}
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                {t('connectToConsole')}
              </>
            )}
          </Button>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Console output */}
        <div
          ref={consoleRef}
          className={cn(
            'bg-gray-950 rounded-lg p-3 font-mono text-sm overflow-auto',
            isExpanded ? 'h-[calc(100vh-220px)]' : 'h-64'
          )}
        >
          {lines.length === 0 ? (
            <div className="text-gray-500 flex items-center justify-center h-full">
              {isConnected ? t('waitingForLogs') : t('emptyConsole')}
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.id} className={cn('leading-relaxed', getLineColor(line.type))}>
                <span className="text-gray-600 text-xs mr-2">
                  {new Date(line.timestamp).toLocaleTimeString()}
                </span>
                {line.line}
              </div>
            ))
          )}
        </div>

        {/* Paused indicator */}
        {isPaused && (
          <div className="flex items-center justify-center gap-2 text-yellow-500 text-sm">
            <Pause className="h-4 w-4" />
            {t('autoScrollPaused')}
          </div>
        )}

        <Separator />

        {/* Command input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {'>'}
            </span>
            <Input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={serverStatus === 1 ? t('typeCommand') : t('serverOffline')}
              className="pl-7 font-mono"
              disabled={!isConnected || serverStatus !== 1 || sendingCommand}
            />
          </div>
          <Button
            onClick={sendCommand}
            disabled={!isConnected || serverStatus !== 1 || sendingCommand || !command.trim()}
          >
            {sendingCommand ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('historyHint', { lines: lines.length })}
        </p>
      </CardContent>
    </Card>
  );
}
