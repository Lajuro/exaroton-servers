'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import ServerCard from '@/components/ServerCard';
import { ServerCardSkeleton } from '@/components/ServerCardSkeleton';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, RefreshCw, Server as ServerIcon, Activity, Users, Search, TrendingUp, Zap, Globe, ArrowDownAZ, BarChart3, UserCheck, Gamepad2, LayoutDashboard } from 'lucide-react';

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

interface ServerIconMap {
  [serverId: string]: string | undefined;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [serverIcons, setServerIcons] = useState<ServerIconMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'players'>('status');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchServers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/servers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login novamente.');
        }
        if (response.status === 404) {
          throw new Error('Usuário não encontrado no sistema.');
        }
        if (response.status === 500) {
          const msg = typeof data?.error === 'string' ? data.error : '';
          if (msg.includes('UNAUTHENTICATED')) {
            throw new Error('Credenciais do Firebase inválidas no servidor (Admin SDK). Verifique o .env.');
          }
          throw new Error(msg || 'Erro no servidor ao buscar servidores.');
        }
        throw new Error('Falha ao buscar servidores.');
      }

      setServers(data.servers || []);
      
      // Buscar ícones dos servidores
      fetchServerIcons(data.servers || []);
    } catch (err) {
      // Diferenciar erros de rede de erros de API
      const isNetworkError = err instanceof TypeError;
      const message = err instanceof Error
        ? err.message
        : isNetworkError
          ? 'Servidor indisponível. Verifique se o app está rodando.'
          : 'Ocorreu um erro.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user]);

  // Fetch server icons from serverContent collection
  const fetchServerIcons = async (serversList: Server[]) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const icons: ServerIconMap = {};
      
      // Buscar conteúdo de cada servidor em paralelo
      await Promise.all(
        serversList.map(async (server) => {
          try {
            const response = await fetch(`/api/servers/${server.id}/content`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.content?.iconUrl) {
                icons[server.id] = data.content.iconUrl;
              }
            }
          } catch {
            // Ignorar erros individuais
          }
        })
      );

      setServerIcons(icons);
    } catch (error) {
      console.error('Error fetching server icons:', error);
    }
  };

  // Filter and sort servers
  const filteredAndSortedServers = useMemo(() => {
    let filtered = servers;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(query) ||
        server.address.toLowerCase().includes(query)
      );
    }

    // Sort servers
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'status':
          // Online servers first (status 1 = online)
          if (a.status !== b.status) {
            return b.status - a.status;
          }
          return a.name.localeCompare(b.name);
        
        case 'players':
          const aPlayers = a.players?.count || 0;
          const bPlayers = b.players?.count || 0;
          if (aPlayers !== bPlayers) {
            return bPlayers - aPlayers;
          }
          return a.name.localeCompare(b.name);
        
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [servers, searchQuery, sortBy]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section - Compact */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-xs text-muted-foreground">Gerencie seus servidores de Minecraft em tempo real</p>
            </div>
          </div>
          <Button
            onClick={fetchServers}
            variant="outline"
            size="sm"
            disabled={loading}
            className="group gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            )}
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* Search and Filter - Premium */}
        {!loading && servers.length > 0 && (
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm border-muted-foreground/20 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: 'name' | 'status' | 'players') => setSortBy(value)}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm border-muted-foreground/20 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="text-xs sm:text-sm">Status</span>
                  </div>
                </SelectItem>
                <SelectItem value="players">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="text-xs sm:text-sm">Jogadores</span>
                  </div>
                </SelectItem>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <ArrowDownAZ className="h-3.5 w-3.5" />
                    <span className="text-xs sm:text-sm">Nome</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stats - Premium Mobile Design */}
        {!loading && servers.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <Card className="relative border hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                  <div className="p-2 sm:p-2 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ServerIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0 space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground/80 leading-tight">Total</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent">{servers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {servers.filter(s => s.status === 1).length > 0 && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/50 via-emerald-500/50 to-green-500/50" />
              )}
              <CardContent className="relative p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                  <div className="p-2 sm:p-2 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0 space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground/80 leading-tight">Online</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-green-500 to-green-600 bg-clip-text text-transparent">{servers.filter(s => s.status === 1).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                  <div className="p-2 sm:p-2 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0 space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground/80 leading-tight">Jogadores</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-purple-500 to-purple-600 bg-clip-text text-transparent">{servers.reduce((total, s) => total + (s.players?.count || 0), 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando servidores...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ServerCardSkeleton />
              <ServerCardSkeleton />
              <ServerCardSkeleton />
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-destructive">Erro ao carregar servidores</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
                </div>
                <Button
                  onClick={fetchServers}
                  variant="destructive"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : servers.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <div className="text-center py-16 space-y-4">
                <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                  <ServerIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-medium">Nenhum servidor disponível</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {user.isAdmin
                      ? 'Configure a API key do Exaroton para começar a gerenciar seus servidores.'
                      : 'Você ainda não tem acesso a nenhum servidor. Entre em contato com um administrador para solicitar acesso.'}
                  </p>
                </div>
                {user.isAdmin && (
                  <Button variant="outline" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Ver documentação
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : filteredAndSortedServers.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Nenhum servidor encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Não encontramos resultados para &quot;{searchQuery}&quot;
                  </p>
                </div>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Limpar busca
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results counter */}
            {(searchQuery || sortBy !== 'status') && (
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-muted-foreground">
                  Exibindo <span className="font-medium text-foreground">{filteredAndSortedServers.length}</span> de <span className="font-medium text-foreground">{servers.length}</span> servidor{servers.length !== 1 && 'es'}
                </p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
            
            {/* Server Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedServers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  isAdmin={user.isAdmin}
                  onUpdate={fetchServers}
                  iconUrl={serverIcons[server.id]}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
