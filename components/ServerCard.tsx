'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCw, Users, Loader2, AlertTriangle, Wifi, WifiOff, Clock, Zap, Globe, TrendingUp, MessageSquare, Send, Sun, Moon, Cloud, CloudRain, Gamepad2, Info, HardDrive, Server as ServerIcon, Copy, Check } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ServerDetails {
  software?: { id: string; name: string; version: string };
  host?: string;
  port?: number;
  ram?: number;
  motd?: string;
}

interface Server {
  id: string;
  name: string;
  address: string;
  status: number;
  players?: {
    count: number;
    max: number;
  };
}

interface ServerCardProps {
  server: Server;
  isAdmin: boolean;
  onUpdate: () => void;
  iconUrl?: string; // Ícone customizado do servidor
}

type CommandType = 'custom' | 'message' | 'time' | 'weather' | 'gamemode';

const COMMAND_TEMPLATES = {
  message: { label: '💬 Enviar mensagem', placeholder: 'Digite a mensagem', prefix: 'say' },
  time: { label: '⏰ Mudar horário', options: ['day', 'night', 'noon', 'midnight'] },
  weather: { label: '🌤️ Mudar clima', options: ['clear', 'rain', 'thunder'] },
  gamemode: { label: '🎮 Modo de jogo', options: ['survival', 'creative', 'adventure', 'spectator'] },
};

const STATUS_NAMES: { [key: number]: string } = {
  0: 'Offline',
  1: 'Online',
  2: 'Iniciando',
  3: 'Parando',
  4: 'Reiniciando',
  5: 'Salvando',
  6: 'Carregando',
  7: 'Travado',
  8: 'Desconhecido',
  10: 'Preparando',
};

export default function ServerCard({ server: initialServer, isAdmin, onUpdate, iconUrl }: ServerCardProps) {
  const [server, setServer] = useState(initialServer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'start' | 'stop' | 'restart' | null }>({ open: false, action: null });
  const [commandDialog, setCommandDialog] = useState(false);
  const [commandType, setCommandType] = useState<CommandType>('custom');
  const [command, setCommand] = useState('');
  const [commandOption, setCommandOption] = useState('');
  const [sendingCommand, setSendingCommand] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [serverDetails, setServerDetails] = useState<ServerDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const { toast } = useToast();

  // Update local state when prop changes
  useEffect(() => {
    setServer(initialServer);
  }, [initialServer]);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-green-500';
      case 0:
        return 'bg-red-500';
      case 2:
      case 4:
      case 5:
      case 6:
      case 10:
        return 'bg-yellow-500';
      default:
        return 'bg-zinc-500';
    }
  };

  // Connect to real-time updates via SSE
  useEffect(() => {
    const connectSSE = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        // Close existing connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const eventSource = new EventSource(
          `/api/servers/${server.id}/stream?token=${encodeURIComponent(token)}`
        );

        eventSource.onopen = () => {
          setIsLive(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setServer((prev) => ({ ...prev, ...data }));
          } catch (err) {
            console.error('Failed to parse SSE message:', err);
          }
        };

        eventSource.onerror = () => {
          setIsLive(false);
          eventSource.close();
          
          // Retry connection after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 5000);
        };

        eventSourceRef.current = eventSource;
      } catch (err) {
        console.error('SSE connection error:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [server.id]);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/servers/${server.id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} server`);
      }

      // Show success toast
      const actionNames = {
        start: 'iniciado',
        stop: 'parado',
        restart: 'reiniciado',
      };
      
      toast({
        title: 'Sucesso!',
        description: `Servidor ${server.name} ${actionNames[action]} com sucesso.`,
      });

      // Update will come via SSE, but call onUpdate for any parent refresh logic
      onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(server.address);
      setAddressCopied(true);
      
      toast({
        title: 'Copiado!',
        description: `Endereço ${server.address} copiado para a área de transferência.`,
      });

      setTimeout(() => {
        setAddressCopied(false);
      }, 2000);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o endereço',
        variant: 'destructive',
      });
    }
  };

  const handleSendCommand = async () => {
    // Build the actual command based on type
    let finalCommand = '';
    
    if (commandType === 'custom') {
      if (!command.trim()) {
        toast({
          title: 'Erro',
          description: 'Digite um comando válido',
          variant: 'destructive',
        });
        return;
      }
      finalCommand = command.trim();
    } else if (commandType === 'message') {
      if (!command.trim()) {
        toast({
          title: 'Erro',
          description: 'Digite a mensagem',
          variant: 'destructive',
        });
        return;
      }
      finalCommand = `say ${command.trim()}`;
    } else if (commandType === 'time') {
      if (!commandOption) {
        toast({
          title: 'Erro',
          description: 'Selecione um horário',
          variant: 'destructive',
        });
        return;
      }
      finalCommand = `time set ${commandOption}`;
    } else if (commandType === 'weather') {
      if (!commandOption) {
        toast({
          title: 'Erro',
          description: 'Selecione um clima',
          variant: 'destructive',
        });
        return;
      }
      finalCommand = `weather ${commandOption}`;
    } else if (commandType === 'gamemode') {
      if (!commandOption) {
        toast({
          title: 'Erro',
          description: 'Selecione um modo de jogo',
          variant: 'destructive',
        });
        return;
      }
      finalCommand = `gamemode ${commandOption} @a`;
    }

    setSendingCommand(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken(true); // Force refresh token
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/servers/${server.id}/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: finalCommand }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute command');
      }

      toast({
        title: 'Sucesso!',
        description: `Comando "${finalCommand}" executado com sucesso.`,
      });

      // Reset form
      setCommand('');
      setCommandOption('');
      setCommandType('custom');
      setCommandDialog(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSendingCommand(false);
    }
  };

  const fetchServerDetails = async () => {
    setLoadingDetails(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/servers/${server.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch server details');
      }

      setServerDetails({
        software: data.software,
        host: data.host,
        port: data.port,
        ram: data.ram,
        motd: data.motd,
      });
      setDetailsDialog(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusVariant = (status: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 1) return 'default'; // Online - green
    if (status === 0) return 'secondary'; // Offline - gray
    if (status === 7) return 'destructive'; // Crashed - red
    return 'outline'; // Transitioning states
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500 hover:shadow-2xl border-none group",
      "bg-gradient-to-br from-card via-card to-card/80 backdrop-blur",
      server.status === 1 && "shadow-lg shadow-green-500/20 hover:shadow-green-500/30",
      error && "shadow-lg shadow-destructive/20"
    )}>
      {/* Status gradient bar */}
      {server.status === 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 animate-pulse-subtle" />
      )}
      {server.status === 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muted via-muted/50 to-muted" />
      )}
      {[2, 3, 4, 5, 6, 10].includes(server.status) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 animate-pulse" />
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2 sm:gap-3">
          {iconUrl ? (
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              <img 
                src={iconUrl} 
                alt={`${server.name} icon`}
                className="w-full h-full object-cover"
              />
              {/* Status indicator overlay */}
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                server.status === 1 ? "bg-green-500" : server.status === 0 ? "bg-gray-500" : "bg-yellow-500 animate-pulse"
              )} />
            </div>
          ) : (
            <div className={cn(
              "p-2 sm:p-2.5 rounded-xl flex-shrink-0 transition-all duration-300",
              server.status === 1 ? "bg-green-500/10 group-hover:bg-green-500/20" : "bg-muted group-hover:bg-muted/80"
            )}>
              {server.status === 1 ? (
                <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5">
            <CardTitle className="truncate text-base sm:text-lg font-bold leading-tight">{server.name}</CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 pb-4">
              <Badge
                variant="secondary"
                className="gap-1 sm:gap-1.5 font-mono text-[10px] sm:text-xs cursor-pointer hover:bg-primary/20 transition-all group px-2 sm:px-2.5 py-0.5 sm:py-1 w-fit"
                onClick={handleCopyAddress}
              >
                <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-none">{server.address}</span>
                {addressCopied ? (
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchServerDetails}
                disabled={loadingDetails}
                className="h-6 sm:h-7 px-1.5 sm:px-2 gap-1 sm:gap-1.5 hover:bg-primary/10 w-fit"
              >
                {loadingDetails ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Info className="h-3 w-3" />
                )}
                <span className="text-[10px] sm:text-xs">Detalhes</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant={getStatusVariant(server.status)}
            className={cn(
              "gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 font-medium text-xs sm:text-sm",
              server.status === 1 && "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
              server.status === 0 && "bg-muted text-muted-foreground",
              [2, 3, 4, 5, 6, 10].includes(server.status) && "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 animate-pulse-subtle"
            )}
          >
            {server.status === 1 && <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            {server.status === 0 && <WifiOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            {[2, 3, 4, 5, 6, 10].includes(server.status) && <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />}
            <span className="truncate">{STATUS_NAMES[server.status] || 'Desconhecido'}</span>
          </Badge>
          
          {server.players && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-purple-500/10 rounded-lg">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                {server.players.count}/{server.players.max}
              </span>
            </div>
          )}
        </div>

        {server.players && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min((server.players.count / server.players.max) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-end text-[10px] sm:text-xs text-muted-foreground">
              <span>{Math.round((server.players.count / server.players.max) * 100)}% de ocupação</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2 backdrop-blur-sm">
            <div className="p-1 bg-destructive/10 rounded flex-shrink-0">
              <AlertTriangle className="h-3 w-3" />
            </div>
            <span className="flex-1">{error}</span>
          </div>
        )}

        <Button
          onClick={() => window.location.href = `/servers/${server.id}`}
          variant="outline"
          className="w-full gap-2"
          size="sm"
        >
          <Info className="h-4 w-4" />
          Ver Detalhes
        </Button>
      </CardContent>

      <CardFooter className="flex gap-1.5 sm:gap-2 pt-3 sm:pt-4">
        {/* Botão Iniciar: apenas quando offline (status 0) */}
        {server.status === 0 && (
          <Button
            onClick={() => handleAction('start')}
            disabled={loading}
            variant="default"
            className="flex-1 gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-all group text-xs sm:text-sm"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" fill="currentColor" />
            )}
            <span className="hidden sm:inline">Iniciar Servidor</span>
            <span className="sm:hidden">Iniciar</span>
          </Button>
        )}
        
        {/* Botões de controle: apenas quando online (status 1) */}
        {server.status === 1 && (
          <>
            <Button
              onClick={() => setConfirmDialog({ open: true, action: 'stop' })}
              disabled={loading}
              variant="destructive"
              className="flex-1 gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-all group text-xs sm:text-sm"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" fill="currentColor" />
              )}
              <span>Parar</span>
            </Button>
            
            {isAdmin && (
              <>
                <Button
                  onClick={() => setConfirmDialog({ open: true, action: 'restart' })}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-all group text-xs sm:text-sm"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:rotate-180 transition-transform duration-500" />
                  )}
                  <span className="hidden md:inline">Reiniciar</span>
                  <span className="md:hidden">Reset</span>
                </Button>
                
                <Button
                  onClick={() => setCommandDialog(true)}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-all group text-xs sm:text-sm"
                  size="sm"
                >
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline">Comando</span>
                  <span className="md:hidden">CMD</span>
                </Button>
              </>
            )}
          </>
        )}
      </CardFooter>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Ação
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'stop' && (
                <>Tem certeza que deseja <strong>parar</strong> o servidor <strong>{server.name}</strong>? Os jogadores online serão desconectados.</>
              )}
              {confirmDialog.action === 'restart' && (
                <>Tem certeza que deseja <strong>reiniciar</strong> o servidor <strong>{server.name}</strong>? Os jogadores online serão desconectados temporariamente.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, action: null })}
            >
              Cancelar
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
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={commandDialog} onOpenChange={(open) => {
        setCommandDialog(open);
        if (!open) {
          setCommand('');
          setCommandOption('');
          setCommandType('custom');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Enviar Comando
            </DialogTitle>
            <DialogDescription>
              Execute comandos do Minecraft diretamente no servidor <strong>{server.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Command Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="command-type">Tipo de Comando</Label>
              <Select value={commandType} onValueChange={(value: CommandType) => {
                setCommandType(value);
                setCommand('');
                setCommandOption('');
              }}>
                <SelectTrigger id="command-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">✏️ Comando personalizado</SelectItem>
                  <SelectItem value="message">{COMMAND_TEMPLATES.message.label}</SelectItem>
                  <SelectItem value="time">{COMMAND_TEMPLATES.time.label}</SelectItem>
                  <SelectItem value="weather">{COMMAND_TEMPLATES.weather.label}</SelectItem>
                  <SelectItem value="gamemode">{COMMAND_TEMPLATES.gamemode.label}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Command Input */}
            {commandType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom-command">Comando</Label>
                <Input
                  id="custom-command"
                  placeholder="Ex: say Olá!, time set day, weather clear"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !sendingCommand && command.trim()) {
                      handleSendCommand();
                    }
                  }}
                  disabled={sendingCommand}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Enter</kbd> para enviar
                </p>
              </div>
            )}

            {/* Message Input */}
            {commandType === 'message' && (
              <div className="space-y-2">
                <Label htmlFor="message-text">Mensagem</Label>
                <Input
                  id="message-text"
                  placeholder={COMMAND_TEMPLATES.message.placeholder}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !sendingCommand && command.trim()) {
                      handleSendCommand();
                    }
                  }}
                  disabled={sendingCommand}
                />
                <p className="text-xs text-muted-foreground">
                  Será enviado como: <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">say {command || '...'}</code>
                </p>
              </div>
            )}

            {/* Time Selector */}
            {commandType === 'time' && (
              <div className="space-y-2">
                <Label htmlFor="time-select">Horário</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger id="time-select">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day"><Sun className="inline h-4 w-4 mr-2" />Dia</SelectItem>
                    <SelectItem value="night"><Moon className="inline h-4 w-4 mr-2" />Noite</SelectItem>
                    <SelectItem value="noon"><Sun className="inline h-4 w-4 mr-2" />Meio-dia</SelectItem>
                    <SelectItem value="midnight"><Moon className="inline h-4 w-4 mr-2" />Meia-noite</SelectItem>
                  </SelectContent>
                </Select>
                {commandOption && (
                  <p className="text-xs text-muted-foreground">
                    Comando: <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">time set {commandOption}</code>
                  </p>
                )}
              </div>
            )}

            {/* Weather Selector */}
            {commandType === 'weather' && (
              <div className="space-y-2">
                <Label htmlFor="weather-select">Clima</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger id="weather-select">
                    <SelectValue placeholder="Selecione o clima" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear"><Sun className="inline h-4 w-4 mr-2" />Limpo</SelectItem>
                    <SelectItem value="rain"><Cloud className="inline h-4 w-4 mr-2" />Chuva</SelectItem>
                    <SelectItem value="thunder"><CloudRain className="inline h-4 w-4 mr-2" />Tempestade</SelectItem>
                  </SelectContent>
                </Select>
                {commandOption && (
                  <p className="text-xs text-muted-foreground">
                    Comando: <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">weather {commandOption}</code>
                  </p>
                )}
              </div>
            )}

            {/* Gamemode Selector */}
            {commandType === 'gamemode' && (
              <div className="space-y-2">
                <Label htmlFor="gamemode-select">Modo de Jogo</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger id="gamemode-select">
                    <SelectValue placeholder="Selecione o modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survival"><Gamepad2 className="inline h-4 w-4 mr-2" />Sobrevivência</SelectItem>
                    <SelectItem value="creative"><Gamepad2 className="inline h-4 w-4 mr-2" />Criativo</SelectItem>
                    <SelectItem value="adventure"><Gamepad2 className="inline h-4 w-4 mr-2" />Aventura</SelectItem>
                    <SelectItem value="spectator"><Gamepad2 className="inline h-4 w-4 mr-2" />Espectador</SelectItem>
                  </SelectContent>
                </Select>
                {commandOption && (
                  <p className="text-xs text-muted-foreground">
                    Comando: <code className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">gamemode {commandOption} @a</code>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommandDialog(false)}
              disabled={sendingCommand}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendCommand}
              disabled={sendingCommand || (commandType === 'custom' && !command.trim()) || (['message'].includes(commandType) && !command.trim()) || (['time', 'weather', 'gamemode'].includes(commandType) && !commandOption)}
              className="gap-2"
            >
              {sendingCommand ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ServerIcon className="h-5 w-5 text-primary" />
              Detalhes do Servidor
            </DialogTitle>
            <DialogDescription>
              Informações técnicas sobre <strong>{server.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(server.status)}>
                    {STATUS_NAMES[server.status] || 'Desconhecido'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Endereço</Label>
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">{server.address}</p>
              </div>
            </div>

            {serverDetails?.host && serverDetails?.port && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Host</Label>
                  <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">{serverDetails.host}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Porta</Label>
                  <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">{serverDetails.port}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Software Info */}
            {serverDetails?.software && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Gamepad2 className="h-3 w-3" />
                  Software
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {serverDetails.software.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Versão: <span className="font-mono">{serverDetails.software.version}</span>
                  </span>
                </div>
              </div>
            )}

            {/* RAM Info */}
            {serverDetails?.ram && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HardDrive className="h-3 w-3" />
                  Memória RAM
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {serverDetails.ram} GB
                      </span>
                      <Badge variant="secondary">Alocada</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MOTD */}
            {serverDetails?.motd && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Mensagem do Dia (MOTD)</Label>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap font-mono">{serverDetails.motd}</p>
                  </div>
                </div>
              </>
            )}

            {/* Players Info */}
            {server.players && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    Jogadores
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Online</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {server.players.count}
                      </p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Máximo</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {server.players.max}
                      </p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Vagas</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {server.players.max - server.players.count}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
