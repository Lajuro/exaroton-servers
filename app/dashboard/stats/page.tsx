'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useImpersonation } from '@/lib/impersonation-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RankingList } from '@/components/RankingList';
import { StatCard } from '@/components/StatCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingDown,
  Clock,
  Coins,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Calendar,
  Activity,
  Server,
  Users,
  Zap,
  Terminal,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatsData {
  isAdmin: boolean;
  credits: {
    summary: {
      current: number;
      thirtyDaysAgo: number;
      spent30Days: number;
      avgPerDay: number;
      projectedMonthly: number;
    };
    chartData: { date: string; credits: number; spent: number }[];
  };
  actions: {
    stats: {
      totalActions: number;
      serverStarts: number;
      serverStops: number;
      serverRestarts: number;
      commands: number;
      failedActions: number;
    };
    byDay: { date: string; starts: number; stops: number; restarts: number; commands: number }[];
    peakHours: { hour: number; count: number }[];
  };
  servers: {
    usage: { serverId: string; serverName: string; hoursOnline: number; avgRam: number }[];
  };
  users: {
    activity: { userId: string; userName: string; photoUrl?: string; actionCount: number }[];
  };
  period: {
    start: string;
    end: string;
  };
}

const CHART_COLORS = {
  primary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  pink: '#ec4899',
  indigo: '#6366f1',
  lime: '#84cc16',
};

// Custom tooltip component for charts with better styling
function CustomChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg backdrop-blur-sm">
      <p className="font-medium text-sm mb-2">{formatter?.(label) || label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Stats page skeleton loader with improved animations
function StatsPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500" role="status" aria-label="Loading statistics">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-full max-w-md" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Error state component with better UX
function StatsErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const tCommon = useTranslations('common');
  
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div 
          className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6 animate-pulse"
          role="img"
          aria-label="Error"
        >
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-destructive mb-2">
          {tCommon('error')}
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">{error}</p>
        <Button onClick={onRetry} variant="outline" size="lg" className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {tCommon('refresh')}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const t = useTranslations('stats');
  const tCommon = useTranslations('common');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
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

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
      };
      
      if (isImpersonating && impersonatedUser) {
        headers['X-Impersonate-User'] = impersonatedUser.uid;
      }

      const response = await fetch('/api/stats', { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
      
      if (!activeTab) {
        setActiveTab(data.isAdmin ? 'credits' : 'actions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading stats');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isImpersonating, impersonatedUser, activeTab]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  // Format date for charts
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
  }, []);

  const formatHour = useCallback((hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  }, []);

  // Memoized data transformations
  const serverRankingItems = useMemo(() => {
    if (!stats) return [];
    return stats.servers.usage.slice(0, 10).map(server => ({
      id: server.serverId,
      name: server.serverName,
      value: server.hoursOnline,
      subtitle: `${server.avgRam} GB RAM`,
      tooltipContent: t('hoursOnline', { hours: server.hoursOnline }),
    }));
  }, [stats, t]);

  const userRankingItems = useMemo(() => {
    if (!stats) return [];
    return stats.users.activity.map(userItem => ({
      id: userItem.userId,
      name: userItem.userName,
      value: userItem.actionCount,
      imageUrl: userItem.photoUrl,
      tooltipContent: t('actionsCount', { count: userItem.actionCount }),
    }));
  }, [stats, t]);

  const actionPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: t('starts'), value: stats.actions.stats.serverStarts, color: CHART_COLORS.success },
      { name: t('stops'), value: stats.actions.stats.serverStops, color: CHART_COLORS.danger },
      { name: t('restarts'), value: stats.actions.stats.serverRestarts, color: CHART_COLORS.warning },
      { name: t('commands'), value: stats.actions.stats.commands, color: CHART_COLORS.info },
    ].filter(item => item.value > 0);
  }, [stats, t]);

  // Loading state
  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-20 pb-8">
          <div className="container max-w-7xl mx-auto px-4">
            <StatsPageSkeleton />
          </div>
        </main>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-20 pb-8">
          <div className="container max-w-7xl mx-auto px-4">
            <StatsErrorState error={error} onRetry={() => fetchStats()} />
          </div>
        </main>
      </>
    );
  }

  if (!stats) return null;

  return (
    <>
      <Navbar />
      <main 
        className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-20 pb-8"
        role="main"
        aria-label={t('title')}
      >
        <div className="container max-w-7xl mx-auto px-4 animate-in fade-in-50 duration-300">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" aria-label={tCommon('back')}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-primary/10 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                  <span 
                    className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
                    aria-hidden="true"
                  >
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </span>
                  {t('title')}
                </h1>
                <p className="text-muted-foreground text-sm mt-1.5">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3 bg-background/50 backdrop-blur-sm">
                      <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      <span className="font-medium">{t('last30Days')}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      {new Date(stats.period.start).toLocaleDateString()} - {new Date(stats.period.end).toLocaleDateString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStats(true)}
                disabled={isRefreshing}
                aria-label={isRefreshing ? tCommon('loading') : tCommon('refresh')}
                className="gap-2"
              >
                <RefreshCw 
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')} 
                  aria-hidden="true" 
                />
                <span className="hidden sm:inline">{tCommon('refresh')}</span>
              </Button>
            </div>
          </header>

          {/* Summary Cards */}
          <section 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            aria-label="Summary statistics"
          >
            {stats.isAdmin && (
              <StatCard
                title={t('currentCredits')}
                value={stats.credits.summary.current.toFixed(2)}
                icon={<Coins className="h-4 w-4" />}
                trend={{
                  value: stats.credits.summary.spent30Days,
                  label: t('spent30Days', { amount: stats.credits.summary.spent30Days.toFixed(2) }),
                  direction: stats.credits.summary.spent30Days > 0 ? 'down' : 'neutral',
                }}
                subtitle={t('spent30Days', { amount: stats.credits.summary.spent30Days.toFixed(2) })}
                tooltipContent="Current Exaroton account balance"
                variant="gradient"
                colorScheme="warning"
              />
            )}

            {stats.isAdmin && (
              <StatCard
                title={t('avgPerDay')}
                value={stats.credits.summary.avgPerDay.toFixed(2)}
                icon={<TrendingDown className="h-4 w-4" />}
                subtitle={t('projectedMonthly', { amount: stats.credits.summary.projectedMonthly.toFixed(2) })}
                tooltipContent="Average daily credit consumption"
                variant="gradient"
                colorScheme="danger"
              />
            )}

            <StatCard
              title={t('totalActions')}
              value={stats.actions.stats.totalActions}
              icon={<Activity className="h-4 w-4" />}
              subtitle={
                stats.actions.stats.failedActions > 0 
                  ? t('failedActions', { count: stats.actions.stats.failedActions })
                  : undefined
              }
              tooltipContent="All server actions in the last 30 days"
              variant="gradient"
              colorScheme="info"
            />

            <StatCard
              title={t('serverStarts')}
              value={stats.actions.stats.serverStarts}
              icon={<Play className="h-4 w-4" />}
              tooltipContent="Number of server starts in the period"
              variant="gradient"
              colorScheme="success"
            />
          </section>

          {/* Action breakdown badges */}
          <section className="flex flex-wrap gap-2 mb-8" aria-label="Action breakdown">
            <Badge variant="outline" className="gap-2 py-1.5 px-3 text-sm">
              <Play className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
              <span className="text-green-600 dark:text-green-400 font-bold tabular-nums">
                {stats.actions.stats.serverStarts}
              </span>
              <span className="text-muted-foreground font-normal">{t('starts')}</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-1.5 px-3 text-sm">
              <Square className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              <span className="text-red-600 dark:text-red-400 font-bold tabular-nums">
                {stats.actions.stats.serverStops}
              </span>
              <span className="text-muted-foreground font-normal">{t('stops')}</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-1.5 px-3 text-sm">
              <RotateCcw className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                {stats.actions.stats.serverRestarts}
              </span>
              <span className="text-muted-foreground font-normal">{t('restarts')}</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-1.5 px-3 text-sm">
              <Terminal className="h-3.5 w-3.5 text-cyan-500" aria-hidden="true" />
              <span className="text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">
                {stats.actions.stats.commands}
              </span>
              <span className="text-muted-foreground font-normal">{t('commands')}</span>
            </Badge>
          </section>

          {/* Tabs */}
          <Tabs 
            value={activeTab || (stats.isAdmin ? 'credits' : 'actions')} 
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 backdrop-blur-sm">
              {stats.isAdmin && (
                <TabsTrigger value="credits" className="gap-2 py-2.5 px-4 data-[state=active]:bg-background">
                  <Coins className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline font-medium">{t('tabs.credits')}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="actions" className="gap-2 py-2.5 px-4 data-[state=active]:bg-background">
                <Activity className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline font-medium">{t('tabs.actions')}</span>
              </TabsTrigger>
              <TabsTrigger value="servers" className="gap-2 py-2.5 px-4 data-[state=active]:bg-background">
                <Server className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline font-medium">{t('tabs.servers')}</span>
              </TabsTrigger>
              {stats.isAdmin && (
                <TabsTrigger value="users" className="gap-2 py-2.5 px-4 data-[state=active]:bg-background">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline font-medium">{t('tabs.users')}</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Credits Tab */}
            {stats.isAdmin && (
              <TabsContent value="credits" className="space-y-6 animate-in fade-in-50 duration-300">
                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                            <Coins className="h-4 w-4 text-primary" aria-hidden="true" />
                          </span>
                          {t('creditsOverTime')}
                        </CardTitle>
                        <CardDescription className="mt-1.5">
                          {t('creditsOverTimeDesc')}
                        </CardDescription>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="text-sm">Shows your credit balance evolution over time</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-72 sm:h-80" role="img" aria-label={t('creditsOverTime')}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={stats.credits.chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                          />
                          <RechartsTooltip content={<CustomChartTooltip formatter={formatDate} />} />
                          <Area
                            type="monotone"
                            dataKey="credits"
                            stroke={CHART_COLORS.primary}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorCredits)"
                            name={t('credits')}
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10">
                        <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
                      </span>
                      {t('dailySpending')}
                    </CardTitle>
                    <CardDescription>{t('dailySpendingDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-56 sm:h-64" role="img" aria-label={t('dailySpending')}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={stats.credits.chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            width={40}
                          />
                          <RechartsTooltip content={<CustomChartTooltip formatter={formatDate} />} />
                          <Bar 
                            dataKey="spent" 
                            fill={CHART_COLORS.danger} 
                            name={t('spent')} 
                            radius={[4, 4, 0, 0]}
                            animationDuration={800}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
                      </span>
                      {t('actionsByDay')}
                    </CardTitle>
                    <CardDescription>{t('actionsByDayDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-56 sm:h-64" role="img" aria-label={t('actionsByDay')}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={stats.actions.byDay}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={30}
                          />
                          <RechartsTooltip content={<CustomChartTooltip formatter={formatDate} />} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                          <Bar dataKey="starts" fill={CHART_COLORS.success} name={t('starts')} stackId="a" />
                          <Bar dataKey="stops" fill={CHART_COLORS.danger} name={t('stops')} stackId="a" />
                          <Bar dataKey="restarts" fill={CHART_COLORS.warning} name={t('restarts')} stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
                        <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      </span>
                      {t('actionBreakdown')}
                    </CardTitle>
                    <CardDescription>{t('actionBreakdownDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-56 sm:h-64" role="img" aria-label={t('actionBreakdown')}>
                      {actionPieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={actionPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="value"
                              animationDuration={800}
                            >
                              {actionPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<CustomChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>No action data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Peak Hours */}
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                      <Clock className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    </span>
                    {t('peakHours')}
                  </CardTitle>
                  <CardDescription>{t('peakHoursDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {stats.actions.peakHours.map((peak, index) => {
                      const isFirst = index === 0;
                      return (
                        <div
                          key={peak.hour}
                          className={cn(
                            'relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200',
                            'hover:shadow-lg hover:-translate-y-1',
                            isFirst && 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/40',
                            !isFirst && 'bg-muted/30 border-transparent hover:border-muted-foreground/20'
                          )}
                          role="listitem"
                        >
                          {isFirst && (
                            <div className="absolute -top-2.5 -right-2.5 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                              #1
                            </div>
                          )}
                          <div className={cn(
                            'flex items-center justify-center w-14 h-14 rounded-xl',
                            isFirst ? 'bg-primary/20' : 'bg-muted'
                          )}>
                            <Clock className={cn('h-7 w-7', isFirst ? 'text-primary' : 'text-muted-foreground')} />
                          </div>
                          <div>
                            <div className={cn('font-bold text-2xl tabular-nums', isFirst && 'text-primary')}>
                              {formatHour(peak.hour)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {t('startsCount', { count: peak.count })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Servers Tab */}
            <TabsContent value="servers" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Server className="h-4 w-4 text-primary" aria-hidden="true" />
                      </span>
                      {t('serverUsage')}
                    </CardTitle>
                    <CardDescription>{t('serverUsageDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <RankingList
                      items={serverRankingItems}
                      valueFormatter={(value) => `${value}h`}
                      emptyMessage={t('noServerData')}
                      showMedals={true}
                      showProgress={true}
                      ariaLabel={t('serverUsage')}
                    />
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
                      </span>
                      {t('serverUsageChart')}
                    </CardTitle>
                    <CardDescription>{t('serverUsageChartDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-56 sm:h-64" role="img" aria-label={t('serverUsageChart')}>
                      {stats.servers.usage.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={stats.servers.usage.slice(0, 5)} 
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" horizontal={false} />
                            <XAxis 
                              type="number" 
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="serverName"
                              stroke="hsl(var(--muted-foreground))"
                              width={100}
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '…' : value}
                            />
                            <RechartsTooltip content={<CustomChartTooltip />} />
                            <Bar 
                              dataKey="hoursOnline" 
                              fill={CHART_COLORS.primary} 
                              name="Hours online"
                              radius={[0, 6, 6, 0]}
                              animationDuration={800}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>{t('noServerData')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab (Admin only) */}
            {stats.isAdmin && (
              <TabsContent value="users" className="space-y-6 animate-in fade-in-50 duration-300">
                <Card className="overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                      </span>
                      {t('mostActiveUsers')}
                    </CardTitle>
                    <CardDescription>{t('mostActiveUsersDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <RankingList
                      items={userRankingItems}
                      valueFormatter={(value) => value.toString()}
                      emptyMessage={t('noUserData')}
                      showMedals={true}
                      showProgress={true}
                      showTrending={true}
                      ariaLabel={t('mostActiveUsers')}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </>
  );
}
