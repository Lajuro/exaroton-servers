'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { GlobalLoading } from '@/components/GlobalLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServerBanner } from '@/components/ServerBanner';
import { ServerIcon } from '@/components/ServerIcon';
import { AccessInstructions } from '@/components/AccessInstructions';
import { DocumentList } from '@/components/DocumentList';
import { ServerControls } from '@/components/ServerControls';
import { ServerConsole } from '@/components/ServerConsole';
import { ServerPiP } from '@/components/ServerPiP';
import OnlinePlayers from '@/components/OnlinePlayers';
import PlayerHistoryCard from '@/components/PlayerHistory';
import { useToast } from '@/components/ui/use-toast';
import { useServerCommand } from '@/lib/useServerCommand';
import { 
  Users, 
  Settings, 
  RefreshCw,
  Copy,
  Server,
  Cpu,
  HardDrive,
  Clock,
  MemoryStick,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { ExarotonServer, ServerContent } from '@/types';

interface ServerDetailPageProps {
  params: Promise<{ id: string }>;
}

const getStatusConfig = (t: (key: string) => string): Record<number, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline'; 
  color: string; 
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
}> => ({
  0: { label: t('status.offline'), variant: 'secondary', color: 'bg-slate-500', icon: <div className="h-2 w-2 rounded-full bg-slate-500" />, gradientFrom: 'from-slate-500', gradientTo: 'to-slate-600', glowColor: 'shadow-slate-500/20' },
  1: { label: t('status.online'), variant: 'default', color: 'bg-emerald-500', icon: <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />, gradientFrom: 'from-emerald-500', gradientTo: 'to-green-600', glowColor: 'shadow-emerald-500/30' },
  2: { label: t('status.starting'), variant: 'outline', color: 'bg-amber-500', icon: <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />, gradientFrom: 'from-amber-500', gradientTo: 'to-yellow-600', glowColor: 'shadow-amber-500/25' },
  3: { label: t('status.stopping'), variant: 'outline', color: 'bg-orange-500', icon: <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />, gradientFrom: 'from-orange-500', gradientTo: 'to-red-600', glowColor: 'shadow-orange-500/25' },
  4: { label: t('status.restarting'), variant: 'outline', color: 'bg-blue-500', icon: <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />, gradientFrom: 'from-blue-500', gradientTo: 'to-indigo-600', glowColor: 'shadow-blue-500/25' },
  5: { label: t('status.saving'), variant: 'outline', color: 'bg-cyan-500', icon: <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />, gradientFrom: 'from-cyan-500', gradientTo: 'to-blue-600', glowColor: 'shadow-cyan-500/25' },
  6: { label: t('status.loading'), variant: 'outline', color: 'bg-indigo-500', icon: <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />, gradientFrom: 'from-indigo-500', gradientTo: 'to-purple-600', glowColor: 'shadow-indigo-500/25' },
  10: { label: t('status.preparing'), variant: 'outline', color: 'bg-violet-500', icon: <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />, gradientFrom: 'from-violet-500', gradientTo: 'to-purple-600', glowColor: 'shadow-violet-500/25' },
});

// Maximum number of reconnection attempts before giving up
const MAX_RECONNECT_ATTEMPTS = 5;
// Base delay between reconnection attempts (will use exponential backoff)
const BASE_RECONNECT_DELAY = 2000;

export default function ServerDetailPage({ params }: ServerDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('servers');
  const tCommon = useTranslations('common');
  const [serverId, setServerId] = useState<string>('');
  const [server, setServer] = useState<ExarotonServer | null>(null);
  const [content, setContent] = useState<ServerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [_fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastActionTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isUnmountedRef = useRef<boolean>(false);

  // Use centralized command hook
  const { sendCommand: handleSendCommand, isLoading: sendingCommand } = useServerCommand({
    serverId,
    serverName: server?.name,
  });

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

  // Connect to SSE with proper error handling and reconnection logic
  const connectSSE = useCallback(async () => {
    // Don't connect if unmounted or no serverId
    if (isUnmountedRef.current || !serverId) return;
    
    // Clean up existing connection first
    cleanupSSE();

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || isUnmountedRef.current) return;

      const eventSource = new EventSource(
        `/api/servers/${serverId}/stream?token=${encodeURIComponent(token)}`
      );

      eventSource.onmessage = (event) => {
        // Don't process if unmounted
        if (isUnmountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status' && data.server) {
            // Reset reconnect attempts on successful message
            reconnectAttemptsRef.current = 0;
            
            // Previne que estados de transição sejam sobrescritos por mensagens antigas
            const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
            const isTransitioningStatus = [2, 3, 4, 5, 6, 10].includes(data.server.status);
            
            // Se acabamos de executar uma ação (< 2s), só aceita estados de transição ou finais
            if (timeSinceLastAction < 2000 && !isTransitioningStatus && data.server.status !== 0 && data.server.status !== 1) {
              return;
            }
            
            setServer(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                status: data.server.status,
                players: data.server.players || prev.players,
              };
            });
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        // Don't reconnect if unmounted
        if (isUnmountedRef.current) {
          eventSource.close();
          return;
        }
        
        eventSource.close();
        eventSourceRef.current = null;
        
        // Check if we should attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          // Use exponential backoff
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current && serverId) {
              connectSSE();
            }
          }, delay);
        } else {
          console.log('[SSE] Max reconnection attempts reached, stopping reconnection');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error connecting to SSE:', error);
    }
  }, [serverId, cleanupSSE]);

  useEffect(() => {
    params.then(p => setServerId(p.id));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Main effect for fetching data and connecting SSE
  useEffect(() => {
    if (user && serverId) {
      isUnmountedRef.current = false;
      reconnectAttemptsRef.current = 0;
      
      fetchServerData();
      fetchServerContent();
      connectSSE();
    }

    return () => {
      isUnmountedRef.current = true;
      cleanupSSE();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, serverId]);

  const fetchServerData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const url = forceRefresh 
        ? `/api/servers/${serverId}?forceRefresh=true`
        : `/api/servers/${serverId}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch server');
      }

      const data = await response.json();
      setServer(data.server);
      setFromCache(data.fromCache || false);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      if (error.message === 'Access denied') {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchServerContent = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/servers/${serverId}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      setActionLoading(action);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} server`);
      }

      const actionLabels = {
        start: t('toast.serverStarting', { name: '' }),
        stop: t('toast.serverStopping', { name: '' }),
        restart: t('toast.serverRestarting', { name: '' }),
      };

      toast({
        title: t('toast.commandSent'),
        description: actionLabels[action],
      });

      // Marcar tempo da ação para evitar race conditions com SSE
      lastActionTimeRef.current = Date.now();
      
      // Atualizar o estado local imediatamente
      if (action === 'start') {
        setServer(prev => prev ? { ...prev, status: 2 } : prev);
      } else if (action === 'stop') {
        setServer(prev => prev ? { ...prev, status: 3 } : prev);
      } else if (action === 'restart') {
        setServer(prev => prev ? { ...prev, status: 4 } : prev);
      }
    } catch (err: any) {
      toast({
        title: tCommon('error'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: tCommon('copied'),
      description: t('copiedToClipboard', { label }),
    });
  };

  // handleSendCommand is now provided by useServerCommand hook

  if (authLoading || loading) {
    return <GlobalLoading message={t('loadingServer')} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Server className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{t('errorLoading')}</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToDashboard')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!server) return null;

  const statusConfig = getStatusConfig(t);
  const statusInfo = statusConfig[server.status] || statusConfig[0];
  const canControl = user?.isAdmin || user?.serverAccess?.includes(serverId);
  const isOnline = server.status === 1;
  const playersPercentage = server.players ? (server.players.count / server.players.max) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Banner com overlay gradiente */}
      <div className="relative">
        <ServerBanner 
          imageUrl={content?.bannerUrl} 
          serverName={server.name} 
          position={content?.bannerPosition}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Botão voltar flutuante com efeito acrílico */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10 z-10"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-12">
        {/* Header Card com efeito glassmorphism */}
        <Card className={`mb-6 overflow-hidden border border-white/20 dark:border-white/10 relative shadow-md ${statusInfo.glowColor} bg-white/40 dark:bg-black/30 backdrop-blur-md`}>
          {/* Status accent bar no topo */}
          <div className={`absolute top-0 left-0 right-0 h-1 z-10 bg-gradient-to-r ${statusInfo.gradientFrom} ${statusInfo.gradientTo} ${server.status !== 0 && server.status !== 1 ? 'animate-pulse' : ''}`} />
          
          {/* Glow effect sutil */}
          {isOnline && (
            <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
          )}
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Ícone do Servidor */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <ServerIcon iconUrl={content?.iconUrl} serverName={server.name} size={120} />
                  <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full ${statusInfo.color} border-4 border-background`} />
                </div>
              </div>
              
              {/* Info do Servidor */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 truncate">{server.name}</h1>
                    
                    {/* Descrição customizada */}
                    {content?.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">{content.description}</p>
                    )}
                    
                    {/* Badges de status */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge 
                        variant={statusInfo.variant} 
                        className="gap-1.5 px-3 py-1"
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                      
                      <Badge variant="outline" className="gap-1.5">
                        <Users className="h-3 w-3" />
                        {server.players?.count ?? 0}/{server.players?.max ?? 0} {t('players')}
                      </Badge>
                    </div>

                    {/* Endereço do servidor com botão de copiar - estilo acrílico */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-black/20 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 w-fit group/address hover:bg-black/30 dark:hover:bg-white/15 transition-all duration-200">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <code className="text-sm md:text-base font-mono font-semibold tracking-tight">
                        {server.address}
                      </code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-60 group-hover/address:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(server.address, t('address'))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    {/* Picture-in-Picture Button */}
                    {canControl && (
                      <ServerPiP
                        serverId={serverId}
                        serverName={server.name}
                        serverAddress={server.address}
                        serverIcon={content?.iconUrl}
                        initialStatus={server.status}
                        initialPlayers={server.players}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchServerData(true)}
                      title={t('refreshData')}
                      className="bg-background/50 backdrop-blur-sm"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {canControl && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/servers/${serverId}/edit`)}
                        className="bg-background/50 backdrop-blur-sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {tCommon('edit')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de progresso de jogadores
          <div className="h-1 bg-muted/50">
            <div 
              className={`h-full transition-all duration-500 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
              style={{ width: `${Math.max(playersPercentage, 2)}%` }}
            />
          </div> */}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Jogadores Online - só aparece quando servidor está online */}
            {isOnline && (
              <OnlinePlayers
                players={server.players?.list || []}
                maxPlayers={server.players?.max || 0}
                serverStatus={server.status}
              />
            )}

            {/* Instruções de Acesso */}
            <AccessInstructions content={content?.accessInstructions} />

            {/* Console do Servidor (apenas para admins) */}
            {user?.isAdmin && (
              <ServerConsole
                serverId={serverId}
                serverName={server.name}
                serverStatus={server.status}
                isAdmin={user?.isAdmin || false}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Controles */}
            <ServerControls
              serverStatus={server.status}
              actionLoading={actionLoading}
              sendingCommand={sendingCommand}
              onAction={handleAction}
              onSendCommand={handleSendCommand}
              isAdmin={user?.isAdmin}
            />

            {/* Ranking de Jogadores */}
            <PlayerHistoryCard 
              serverId={serverId}
              serverName={server.name}
            />

            {/* Documentos */}
            {content?.documents && content.documents.length > 0 && (
              <DocumentList documents={content.documents} canEdit={false} />
            )}

            {/* Informações do servidor */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Server className="h-5 w-5 text-purple-500" />
                  </div>
                  {t('info.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                    <span className="text-muted-foreground flex items-center gap-3 text-sm">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Cpu className="h-4 w-4 text-purple-500" />
                      </div>
                      {t('info.software')}
                    </span>
                    <span className="font-medium text-sm">{server.software?.name ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                    <span className="text-muted-foreground flex items-center gap-3 text-sm">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <HardDrive className="h-4 w-4 text-purple-500" />
                      </div>
                      {t('info.version')}
                    </span>
                    <span className="font-medium text-sm">{server.software?.version ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                    <span className="text-muted-foreground flex items-center gap-3 text-sm">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Users className="h-4 w-4 text-purple-500" />
                      </div>
                      {t('info.slots')}
                    </span>
                    <span className="font-medium text-sm">{server.players?.max ?? 0} {t('players')}</span>
                  </div>
                  {server.ram && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                      <span className="text-muted-foreground flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <MemoryStick className="h-4 w-4 text-purple-500" />
                        </div>
                        RAM
                      </span>
                      <span className="font-medium text-sm">{server.ram} GB</span>
                    </div>
                  )}
                  {typeof server.credits === 'number' && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200">
                      <span className="text-muted-foreground flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                        {t('info.credits')}
                      </span>
                      <span className="font-medium text-sm">{server.credits} {t('info.creditsUnit')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
