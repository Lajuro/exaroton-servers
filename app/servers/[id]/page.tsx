'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServerBanner } from '@/components/ServerBanner';
import { ServerIcon } from '@/components/ServerIcon';
import { AccessInstructions } from '@/components/AccessInstructions';
import { DocumentList } from '@/components/DocumentList';
import { 
  Users, 
  Play, 
  Square, 
  RotateCw, 
  Settings, 
  RefreshCw,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { ExarotonServer, ServerContent } from '@/types';

interface ServerDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  0: { label: 'Offline', variant: 'secondary' },
  1: { label: 'Online', variant: 'default' },
  2: { label: 'Iniciando', variant: 'outline' },
  3: { label: 'Parando', variant: 'outline' },
  4: { label: 'Reiniciando', variant: 'outline' },
  10: { label: 'Erro', variant: 'destructive' },
};

export default function ServerDetailPage({ params }: ServerDetailPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [serverId, setServerId] = useState<string>('');
  const [server, setServer] = useState<ExarotonServer | null>(null);
  const [content, setContent] = useState<ServerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      // Cleanup SSE
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
    // Implementar conexão SSE para updates em tempo real
    setIsLive(true); // Temporário
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      setActionLoading(true);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} server`);
      }

      // Aguardar um pouco e atualizar dados
      setTimeout(() => {
        fetchServerData(true);
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!server) return null;

  const statusInfo = statusLabels[server.status] || statusLabels[0];
  const canControl = user?.isAdmin || user?.serverAccess?.includes(serverId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Banner */}
      <ServerBanner 
        imageUrl={content?.bannerUrl} 
        serverName={server.name} 
        position={content?.bannerPosition}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header com ícone e info básica */}
        <div className="flex items-start gap-6 mb-8 -mt-16">
          <div className="relative z-10 shadow-xl rounded-lg">
            <ServerIcon iconUrl={content?.iconUrl} serverName={server.name} size={128} />
          </div>
          
          <div className="flex-1 pt-16">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{server.name}</h1>
                <p className="text-muted-foreground mb-3">{server.address}</p>
                <div className="flex items-center gap-3">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Badge variant="outline">
                    {isLive ? (
                      <>
                        <Wifi className="h-3 w-3 mr-1" />
                        Live
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 mr-1" />
                        Cache {fromCache && '(5min)'}
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchServerData(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {canControl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/servers/${serverId}/edit`)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Jogadores</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {server.players.count}/{server.players.max}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Software</p>
                    <p className="text-lg font-semibold">{server.software.name}</p>
                    <p className="text-sm text-muted-foreground">{server.software.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="text-sm font-mono">{server.host}:{server.port}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instruções de Acesso */}
            <AccessInstructions content={content?.accessInstructions} />

            {/* Documentos */}
            <DocumentList documents={content?.documents || []} canEdit={false} />
          </div>

          {/* Sidebar - Controles */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Controles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => handleAction('start')}
                  disabled={actionLoading || server.status === 1}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Servidor
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading || server.status === 0}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Parar Servidor
                </Button>
                {user?.isAdmin && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction('restart')}
                    disabled={actionLoading || server.status !== 1}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Reiniciar Servidor
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* MOTD */}
            {server.motd && (
              <Card>
                <CardHeader>
                  <CardTitle>MOTD</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{server.motd}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
