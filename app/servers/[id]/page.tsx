'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { GlobalLoading } from '@/components/GlobalLoading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ServerBanner } from '@/components/ServerBanner';
import { ServerIcon } from '@/components/ServerIcon';
import { AccessInstructions } from '@/components/AccessInstructions';
import { DocumentList } from '@/components/DocumentList';
import { ServerControls } from '@/components/ServerControls';
import { useToast } from '@/components/ui/use-toast';
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
  ArrowLeft
} from 'lucide-react';
import { ExarotonServer, ServerContent } from '@/types';

interface ServerDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; icon: React.ReactNode }> = {
  0: { label: 'Offline', variant: 'secondary', color: 'bg-gray-500', icon: <div className="h-2 w-2 rounded-full bg-gray-500" /> },
  1: { label: 'Online', variant: 'default', color: 'bg-green-500', icon: <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> },
  2: { label: 'Iniciando', variant: 'outline', color: 'bg-yellow-500', icon: <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" /> },
  3: { label: 'Parando', variant: 'outline', color: 'bg-orange-500', icon: <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" /> },
  4: { label: 'Reiniciando', variant: 'outline', color: 'bg-blue-500', icon: <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> },
  5: { label: 'Salvando', variant: 'outline', color: 'bg-cyan-500', icon: <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" /> },
  6: { label: 'Carregando', variant: 'outline', color: 'bg-indigo-500', icon: <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" /> },
  10: { label: 'Preparando', variant: 'outline', color: 'bg-amber-500', icon: <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> },
};

export default function ServerDetailPage({ params }: ServerDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [serverId, setServerId] = useState<string>('');
  const [server, setServer] = useState<ExarotonServer | null>(null);
  const [content, setContent] = useState<ServerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendingCommand, setSendingCommand] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  useEffect(() => {
    params.then(p => setServerId(p.id));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && serverId) {
      fetchServerData();
      fetchServerContent();
      connectSSE();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
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
    } catch (err: any) {
      setError(err.message);
      if (err.message === 'Access denied') {
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

  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    auth.currentUser?.getIdToken().then(token => {
      const eventSource = new EventSource(
        `/api/servers/${serverId}/stream?token=${encodeURIComponent(token)}`
      );

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
        eventSource.close();
        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          if (serverId) {
            connectSSE();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    });
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
        start: 'Servidor iniciando...',
        stop: 'Servidor parando...',
        restart: 'Servidor reiniciando...',
      };

      toast({
        title: 'Comando enviado',
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
        title: 'Erro',
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
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleSendCommand = async (command: string) => {
    try {
      setSendingCommand(true);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}/command`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send command');
      }

      toast({
        title: 'Comando enviado',
        description: `Comando "${command}" executado com sucesso.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSendingCommand(false);
    }
  };

  if (authLoading || loading) {
    return <GlobalLoading message="Carregando servidor" />;
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
              <h2 className="text-xl font-semibold mb-2">Erro ao carregar</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!server) return null;

  const statusInfo = statusConfig[server.status] || statusConfig[0];
  const canControl = user?.isAdmin || user?.serverAccess?.includes(serverId);
  const isOnline = server.status === 1;
  const playersPercentage = (server.players.count / server.players.max) * 100;

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
        {/* Header Card com efeito acrílico/glassmorphism */}
        <Card className="mb-6 overflow-hidden bg-background/70 backdrop-blur-xl border-white/10">
          <div className="p-6 md:p-8">
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
                        {server.players.count}/{server.players.max} jogadores
                      </Badge>
                    </div>

                    {/* Endereço do servidor com botão de copiar */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg w-fit">
                      <code className="text-sm md:text-base font-mono font-semibold">
                        {server.address}
                      </code>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(server.address, 'Endereço')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchServerData(true)}
                      title="Atualizar dados"
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
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de progresso de jogadores */}
          <div className="h-1 bg-muted/50">
            <div 
              className={`h-full transition-all duration-500 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
              style={{ width: `${Math.max(playersPercentage, 2)}%` }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instruções de Acesso */}
            <AccessInstructions content={content?.accessInstructions} />
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

            {/* Documentos */}
            {content?.documents && content.documents.length > 0 && (
              <DocumentList documents={content.documents} canEdit={false} />
            )}

            {/* Informações do servidor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Server className="h-5 w-5" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Software
                  </span>
                  <span className="font-medium">{server.software.name}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Versão
                  </span>
                  <span className="font-medium">{server.software.version}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Slots
                  </span>
                  <span className="font-medium">{server.players.max} jogadores</span>
                </div>
                {server.ram && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <MemoryStick className="h-4 w-4" />
                        RAM
                      </span>
                      <span className="font-medium">{server.ram} GB</span>
                    </div>
                  </>
                )}
                {typeof server.credits === 'number' && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Créditos
                      </span>
                      <span className="font-medium">{server.credits} créditos</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
