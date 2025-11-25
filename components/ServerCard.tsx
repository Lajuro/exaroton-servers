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
  ExternalLink
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
  iconUrl?: string;
}

type CommandType = 'custom' | 'message' | 'time' | 'weather' | 'gamemode';

const STATUS_CONFIG: Record<number, { label: string; color: string; bgColor: string; borderColor: string }> = {
  0: { label: 'Offline', color: 'text-gray-500', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20' },
  1: { label: 'Online', color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
  2: { label: 'Iniciando', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
  3: { label: 'Parando', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  4: { label: 'Reiniciando', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  5: { label: 'Salvando', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  6: { label: 'Carregando', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
  7: { label: 'Travado', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  10: { label: 'Preparando', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
};

export default function ServerCard({ server: initialServer, isAdmin, onUpdate, iconUrl }: ServerCardProps) {
  const router = useRouter();
  const [server, setServer] = useState(initialServer);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'start' | 'stop' | 'restart' | null }>({ open: false, action: null });
  const [commandDialog, setCommandDialog] = useState(false);
  const [commandType, setCommandType] = useState<CommandType>('custom');
  const [command, setCommand] = useState('');
  const [commandOption, setCommandOption] = useState('');
  const [sendingCommand, setSendingCommand] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastActionTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const statusInfo = STATUS_CONFIG[server.status] || STATUS_CONFIG[0];
  const isOnline = server.status === 1;
  const isOffline = server.status === 0;
  const isTransitioning = [2, 3, 4, 5, 6, 10].includes(server.status);

  useEffect(() => {
    setServer(initialServer);
  }, [initialServer]);

  // SSE Connection
  useEffect(() => {
    const connectSSE = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

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
            if (data.type === 'status' && data.server) {
              // Previne que estados de transição sejam sobrescritos por mensagens antigas
              const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
              const isTransitioningStatus = [2, 3, 4, 5, 6, 10].includes(data.server.status);
              
              // Se acabamos de executar uma ação (< 2s), só aceita estados de transição ou finais
              if (timeSinceLastAction < 2000 && !isTransitioningStatus && data.server.status !== 0 && data.server.status !== 1) {
                return;
              }
              
              setServer(prev => ({
                ...prev,
                status: data.server.status,
                players: data.server.players || prev.players,
              }));
            }
          } catch (err) {
            console.error('Failed to parse SSE message:', err);
          }
        };

        eventSource.onerror = () => {
          setIsLive(false);
          eventSource.close();
          reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
        };

        eventSourceRef.current = eventSource;
      } catch (err) {
        console.error('SSE connection error:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [server.id]);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(action);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/servers/${server.id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} server`);

      const actionNames = { start: 'iniciando', stop: 'parando', restart: 'reiniciando' };
      toast({
        title: 'Comando enviado',
        description: `Servidor ${server.name} ${actionNames[action]}...`,
      });

      // Marcar tempo da ação para evitar race conditions com SSE
      lastActionTimeRef.current = Date.now();
      
      // Atualiza estado local imediatamente
      const newStatus = action === 'start' ? 2 : action === 'stop' ? 3 : 4;
      setServer(prev => ({ ...prev, status: newStatus }));
      
      onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(server.address);
      setAddressCopied(true);
      toast({
        title: 'Copiado!',
        description: `Endereço copiado para a área de transferência.`,
      });
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível copiar o endereço', variant: 'destructive' });
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

    setSendingCommand(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/servers/${server.id}/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: finalCommand }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to execute command');

      toast({
        title: 'Comando executado',
        description: `"${finalCommand}" enviado com sucesso.`,
      });

      setCommand('');
      setCommandOption('');
      setCommandType('custom');
      setCommandDialog(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSendingCommand(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/servers/${server.id}`);
  };

  return (
    <>
      <Card 
        className={cn(
          "group relative overflow-hidden transition-all duration-300 cursor-pointer",
          "hover:shadow-xl hover:-translate-y-1",
          isOnline && "ring-1 ring-green-500/20 hover:ring-green-500/40",
          isTransitioning && "ring-1 ring-yellow-500/20",
          error && "ring-1 ring-destructive/20"
        )}
        onClick={handleCardClick}
      >
        {/* Barra de status no topo */}
        <div className={cn(
          "h-1 w-full",
          isOnline && "bg-gradient-to-r from-green-500 to-emerald-500",
          isOffline && "bg-gray-300 dark:bg-gray-700",
          isTransitioning && "bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse"
        )} />

        <CardContent className="p-4">
          {/* Header: Ícone + Info */}
          <div className="flex items-start gap-3 mb-4">
            {/* Ícone do servidor */}
            <div className="relative flex-shrink-0">
              {iconUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md ring-1 ring-border">
                  <img 
                    src={iconUrl} 
                    alt={server.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                  statusInfo.bgColor, statusInfo.borderColor, "border"
                )}>
                  {isOnline ? (
                    <Wifi className={cn("h-5 w-5", statusInfo.color)} />
                  ) : (
                    <WifiOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              {/* Status dot */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                isOnline && "bg-green-500",
                isOffline && "bg-gray-400",
                isTransitioning && "bg-yellow-500 animate-pulse"
              )} />
            </div>

            {/* Nome e endereço */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate mb-1 group-hover:text-primary transition-colors">
                {server.name}
              </h3>
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group/addr"
              >
                <Globe className="h-3 w-3 flex-shrink-0" />
                <code className="truncate max-w-[140px]">{server.address}</code>
                {addressCopied ? (
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Copy className="h-3 w-3 opacity-0 group-hover/addr:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </button>
            </div>

            {/* Live indicator */}
            {isLive && (
              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="hidden sm:inline">LIVE</span>
              </div>
            )}
          </div>

          {/* Status e Players */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <Badge 
              variant="outline"
              className={cn(
                "gap-1.5 font-medium",
                statusInfo.bgColor, statusInfo.borderColor, statusInfo.color
              )}
            >
              {isOnline && <Zap className="h-3 w-3" />}
              {isOffline && <WifiOff className="h-3 w-3" />}
              {isTransitioning && <Clock className="h-3 w-3 animate-spin" />}
              {statusInfo.label}
            </Badge>

            {server.players && (
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium tabular-nums">
                  {server.players.count}
                  <span className="text-muted-foreground">/{server.players.max}</span>
                </span>
              </div>
            )}
          </div>

          {/* Barra de jogadores */}
          {server.players && (
            <div className="mb-4">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isOnline ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-400"
                  )}
                  style={{ width: `${Math.max((server.players.count / server.players.max) * 100, 2)}%` }}
                />
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive mb-3 p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Offline: Mostrar botão iniciar */}
            {isOffline && (
              <Button
                onClick={() => handleAction('start')}
                disabled={loading !== null}
                className="flex-1 gap-2"
                size="sm"
              >
                {loading === 'start' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" fill="currentColor" />
                )}
                Iniciar
              </Button>
            )}

            {/* Transição: Mostrar estado */}
            {isTransitioning && (
              <Button
                disabled
                variant="outline"
                className="flex-1 gap-2"
                size="sm"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {statusInfo.label}...
              </Button>
            )}

            {/* Online: Mostrar controles */}
            {isOnline && (
              <>
                <Button
                  onClick={() => setConfirmDialog({ open: true, action: 'stop' })}
                  disabled={loading !== null}
                  variant="destructive"
                  className="flex-1 gap-2"
                  size="sm"
                >
                  {loading === 'stop' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" fill="currentColor" />
                  )}
                  Parar
                </Button>

                <Button
                  onClick={() => setConfirmDialog({ open: true, action: 'restart' })}
                  disabled={loading !== null}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {loading === 'restart' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Reiniciar</span>
                </Button>

                {isAdmin && (
                  <Button
                    onClick={() => setCommandDialog(true)}
                    disabled={loading !== null}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Terminal className="h-4 w-4" />
                    <span className="hidden sm:inline">Comando</span>
                  </Button>
                )}
              </>
            )}

            {/* Botão Ver detalhes */}
            <Button
              onClick={handleCardClick}
              variant="ghost"
              size="sm"
              className="gap-1 ml-auto"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
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
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: null })}>
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

      {/* Dialog de Comando */}
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
              <Terminal className="h-5 w-5" />
              Enviar Comando
            </DialogTitle>
            <DialogDescription>
              Execute comandos no servidor <strong>{server.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Comando</Label>
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
                      Comando Personalizado
                    </div>
                  </SelectItem>
                  <SelectItem value="message">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Enviar Mensagem
                    </div>
                  </SelectItem>
                  <SelectItem value="time">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Mudar Horário
                    </div>
                  </SelectItem>
                  <SelectItem value="weather">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      Mudar Clima
                    </div>
                  </SelectItem>
                  <SelectItem value="gamemode">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      Modo de Jogo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(commandType === 'custom' || commandType === 'message') && (
              <div className="space-y-2">
                <Label>{commandType === 'custom' ? 'Comando' : 'Mensagem'}</Label>
                <Input
                  placeholder={commandType === 'custom' ? 'Ex: give @a diamond 64' : 'Digite a mensagem...'}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                  className="font-mono"
                />
                {commandType === 'custom' && (
                  <p className="text-xs text-muted-foreground">
                    Não inclua a barra (/) no início
                  </p>
                )}
              </div>
            )}

            {commandType === 'time' && (
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day"><Sun className="inline h-4 w-4 mr-2" />Dia</SelectItem>
                    <SelectItem value="noon"><Sun className="inline h-4 w-4 mr-2" />Meio-dia</SelectItem>
                    <SelectItem value="night"><Moon className="inline h-4 w-4 mr-2" />Noite</SelectItem>
                    <SelectItem value="midnight"><Moon className="inline h-4 w-4 mr-2" />Meia-noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {commandType === 'weather' && (
              <div className="space-y-2">
                <Label>Clima</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o clima" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear"><Sun className="inline h-4 w-4 mr-2" />Limpo</SelectItem>
                    <SelectItem value="rain"><Cloud className="inline h-4 w-4 mr-2" />Chuva</SelectItem>
                    <SelectItem value="thunder"><CloudRain className="inline h-4 w-4 mr-2" />Tempestade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {commandType === 'gamemode' && (
              <div className="space-y-2">
                <Label>Modo de Jogo (para todos)</Label>
                <Select value={commandOption} onValueChange={setCommandOption}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modo" />
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommandDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendCommand} disabled={sendingCommand}>
              {sendingCommand ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Executar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
