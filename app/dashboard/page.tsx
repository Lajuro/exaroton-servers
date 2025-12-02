'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import ServerCard from '@/components/ServerCard';
import { ServerCardSkeleton } from '@/components/ServerCardSkeleton';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { PageTransition } from '@/components/GlobalLoading';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Server as ServerIcon, 
  Activity, 
  Users, 
  Search, 
  ArrowDownAZ, 
  BarChart3, 
  UserCheck, 
  LayoutDashboard,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';
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

interface ServerIconMap {
  [serverId: string]: string | undefined;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tServers = useTranslations('servers');
  const [servers, setServers] = useState<Server[]>([]);
  const [serverIcons, setServerIcons] = useState<ServerIconMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'players'>('status');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchServers = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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
          throw new Error(tAuth('unauthorized'));
        }
        if (response.status === 404) {
          throw new Error(tAuth('userNotFound'));
        }
        if (response.status === 500) {
          const msg = typeof data?.error === 'string' ? data.error : '';
          if (msg.includes('UNAUTHENTICATED')) {
            throw new Error(tAuth('invalidCredentials'));
          }
          throw new Error(msg || tServers('fetchError'));
        }
        throw new Error(tServers('fetchError'));
      }

      setServers(data.servers || []);
      fetchServerIcons(data.servers || []);
    } catch (err) {
      const isNetworkError = err instanceof TypeError;
      const message = err instanceof Error
        ? err.message
        : isNetworkError
          ? tCommon('serverUnavailable')
          : tCommon('errorOccurred');
      setError(message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchServerIcons = async (serversList: Server[]) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const icons: ServerIconMap = {};
      
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
            // Ignore individual errors
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(query) ||
        server.address.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'status':
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

  const _handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isPageLoading = authLoading || !user;

  // Stats calculations
  const onlineServers = servers.filter(s => s.status === 1).length;
  const totalPlayers = servers.reduce((total, s) => total + (s.players?.count || 0), 0);
  const maxPlayers = servers.reduce((total, s) => total + (s.players?.max || 0), 0);

  return (
    <PageTransition
      isLoading={isPageLoading}
      loadingComponent={<DashboardSkeleton />}
    >
      <div className="min-h-screen relative overflow-hidden">
        {/* Deep background with multiple layers */}
        <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background" />
        
        {/* Subtle grid pattern */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Radial gradient overlays for depth */}
        <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" />
        <div className="fixed top-1/3 right-0 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-3xl" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-3xl" />
        
        {/* Noise texture overlay for premium feel */}
        <div className="fixed inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

        {/* Content */}
        <div className="relative z-10">
          <Navbar />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 md:p-8">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -ml-24 -mb-24" />
            
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-lg shadow-primary/5">
                  <LayoutDashboard className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
                    {onlineServers > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        <Zap className="h-3 w-3" />
                        {onlineServers} {tCommon('online').toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">{t('manageServers')}</p>
                </div>
              </div>
              
              <Button
                onClick={() => fetchServers(true)}
                variant="outline"
                size="sm"
                disabled={loading || isRefreshing}
                className={cn(
                  "group gap-2 transition-all duration-300",
                  "hover:bg-primary/10 hover:border-primary/30 hover:text-primary",
                  isRefreshing && "pointer-events-none"
                )}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 transition-transform duration-500",
                  isRefreshing && "animate-spin",
                  !isRefreshing && "group-hover:rotate-180"
                )} />
                <span className="hidden sm:inline">{tCommon('refresh')}</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {!loading && servers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Servers */}
              <Card className={cn(
                "group relative overflow-hidden border-border/50",
                "hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5",
                "transition-all duration-500"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
                      "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                    )}>
                      <ServerIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{tCommon('total')}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                          {servers.length}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {servers.length === 1 ? 'server' : 'servers'}
                        </span>
                      </div>
                    </div>
                    <TrendingUp className="h-5 w-5 text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                  </div>
                </CardContent>
              </Card>

              {/* Online Servers */}
              <Card className={cn(
                "group relative overflow-hidden border-border/50",
                "hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5",
                "transition-all duration-500"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {onlineServers > 0 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500" />
                )}
                <CardContent className="relative p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      "bg-gradient-to-br from-emerald-500/20 to-green-600/10",
                      "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
                    )}>
                      <Activity className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{tCommon('online')}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                          {onlineServers}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {servers.length}
                        </span>
                      </div>
                    </div>
                    {onlineServers > 0 && (
                      <div className="relative">
                        <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Total Players */}
              <Card className={cn(
                "group relative overflow-hidden border-border/50",
                "hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5",
                "transition-all duration-500"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      "bg-gradient-to-br from-violet-500/20 to-purple-600/10",
                      "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-violet-500/20"
                    )}>
                      <Users className="h-6 w-6 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('players')}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                          {totalPlayers}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {maxPlayers}
                        </span>
                      </div>
                    </div>
                    {totalPlayers > 0 && (
                      <Sparkles className="h-5 w-5 text-violet-500/50 group-hover:text-violet-500 transition-colors" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter */}
          {!loading && servers.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <Search className={cn(
                  "absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4",
                  "text-muted-foreground group-focus-within:text-primary transition-colors duration-300"
                )} />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-10 h-11 text-sm",
                    "border-border/50 bg-background/50 backdrop-blur-sm",
                    "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
                    "transition-all duration-300"
                  )}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </Button>
                )}
              </div>
              
              <Select value={sortBy} onValueChange={(value: 'name' | 'status' | 'players') => setSortBy(value)}>
                <SelectTrigger className={cn(
                  "w-full sm:w-[160px] h-11",
                  "border-border/50 bg-background/50 backdrop-blur-sm",
                  "hover:border-primary/30 transition-colors duration-300"
                )}>
                  <SelectValue placeholder={tCommon('sort')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t('sortByStatus')}
                    </div>
                  </SelectItem>
                  <SelectItem value="players">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      {t('sortByPlayers')}
                    </div>
                  </SelectItem>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <ArrowDownAZ className="h-4 w-4" />
                      {t('sortByName')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="relative">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{t('loadingServers')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ServerCardSkeleton />
                <ServerCardSkeleton />
                <ServerCardSkeleton />
              </div>
            </div>
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="text-center py-16 space-y-4">
                  <div className={cn(
                    "mx-auto w-20 h-20 rounded-2xl flex items-center justify-center",
                    "bg-destructive/10 border border-destructive/20"
                  )}>
                    <AlertCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-destructive">{t('errorLoading')}</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
                  </div>
                  <Button
                    onClick={() => fetchServers()}
                    variant="destructive"
                    className="gap-2 mt-4"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('tryAgain')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : servers.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="pt-6">
                <div className="text-center py-20 space-y-6">
                  <div className={cn(
                    "mx-auto w-24 h-24 rounded-2xl flex items-center justify-center",
                    "bg-muted/50 border border-border"
                  )}>
                    <ServerIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold">{t('noServersAvailable')}</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {user?.isAdmin
                        ? t('configureApiKey')
                        : t('noAccessYet')}
                    </p>
                  </div>
                  {user?.isAdmin && (
                    <Button variant="outline" className="gap-2 mt-4">
                      <AlertCircle className="h-4 w-4" />
                      {t('viewDocs')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : filteredAndSortedServers.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="pt-6">
                <div className="text-center py-16 space-y-4">
                  <div className={cn(
                    "mx-auto w-20 h-20 rounded-2xl flex items-center justify-center",
                    "bg-muted/50 border border-border"
                  )}>
                    <Search className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">{t('noServersFound')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('noResultsFor', { query: searchQuery })}
                    </p>
                  </div>
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="outline"
                    className="gap-2 mt-4"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('clearSearch')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Results counter */}
              {(searchQuery || sortBy !== 'status') && (
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm text-muted-foreground">
                    {t('showingServers', { shown: filteredAndSortedServers.length, total: servers.length })}
                  </p>
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery('')}
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {t('clearFilters')}
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
                    isAdmin={user?.isAdmin ?? false}
                    onUpdate={() => fetchServers()}
                    iconUrl={serverIcons[server.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
        </div>
      </div>
    </PageTransition>
  );
}
