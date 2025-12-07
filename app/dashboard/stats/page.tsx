'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16'];

export default function StatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('stats');
  const tCommon = useTranslations('common');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchStats = async (isManualRefresh = false) => {
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

      const response = await fetch('/api/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading stats');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Format date for charts
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-20 pb-8">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-80" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-20 pb-8">
          <div className="container max-w-7xl mx-auto px-4">
            <Card className="border-destructive">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive font-medium">{error}</p>
                <Button onClick={() => fetchStats()} className="mt-4">
                  {tCommon('refresh')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  if (!stats) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-20 pb-8">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  {t('title')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t('last30Days')}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStats(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                {tCommon('refresh')}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Credits Card */}
            {stats.isAdmin && (
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {t('currentCredits')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.credits.summary.current.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    {t('spent30Days', { amount: stats.credits.summary.spent30Days.toFixed(2) })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Average per Day */}
            {stats.isAdmin && (
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    {t('avgPerDay')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.credits.summary.avgPerDay.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('projectedMonthly', { amount: stats.credits.summary.projectedMonthly.toFixed(2) })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Total Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {t('totalActions')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.actions.stats.totalActions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.actions.stats.failedActions > 0 && (
                    <span className="text-destructive">
                      {t('failedActions', { count: stats.actions.stats.failedActions })}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            {/* Server Starts */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  {t('serverStarts')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.actions.stats.serverStarts}</div>
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Square className="h-3 w-3 text-red-500" />
                    {stats.actions.stats.serverStops}
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3 text-yellow-500" />
                    {stats.actions.stats.serverRestarts}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="credits" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {stats.isAdmin && <TabsTrigger value="credits">{t('tabs.credits')}</TabsTrigger>}
              <TabsTrigger value="actions">{t('tabs.actions')}</TabsTrigger>
              <TabsTrigger value="servers">{t('tabs.servers')}</TabsTrigger>
              {stats.isAdmin && <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>}
            </TabsList>

            {/* Credits Tab */}
            {stats.isAdmin && (
              <TabsContent value="credits" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('creditsOverTime')}</CardTitle>
                    <CardDescription>{t('creditsOverTimeDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.credits.chartData}>
                          <defs>
                            <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            className="text-xs"
                            stroke="currentColor"
                          />
                          <YAxis className="text-xs" stroke="currentColor" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            labelFormatter={formatDate}
                          />
                          <Area
                            type="monotone"
                            dataKey="credits"
                            stroke="#8b5cf6"
                            fillOpacity={1}
                            fill="url(#colorCredits)"
                            name={t('credits')}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('dailySpending')}</CardTitle>
                    <CardDescription>{t('dailySpendingDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.credits.chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            className="text-xs"
                            stroke="currentColor"
                          />
                          <YAxis className="text-xs" stroke="currentColor" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            labelFormatter={formatDate}
                          />
                          <Bar dataKey="spent" fill="#ef4444" name={t('spent')} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('actionsByDay')}</CardTitle>
                    <CardDescription>{t('actionsByDayDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.actions.byDay}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            className="text-xs"
                            stroke="currentColor"
                          />
                          <YAxis className="text-xs" stroke="currentColor" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            labelFormatter={formatDate}
                          />
                          <Legend />
                          <Bar dataKey="starts" fill="#10b981" name={t('starts')} stackId="a" />
                          <Bar dataKey="stops" fill="#ef4444" name={t('stops')} stackId="a" />
                          <Bar dataKey="restarts" fill="#f59e0b" name={t('restarts')} stackId="a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('actionBreakdown')}</CardTitle>
                    <CardDescription>{t('actionBreakdownDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: t('starts'), value: stats.actions.stats.serverStarts },
                              { name: t('stops'), value: stats.actions.stats.serverStops },
                              { name: t('restarts'), value: stats.actions.stats.serverRestarts },
                              { name: t('commands'), value: stats.actions.stats.commands },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[0, 1, 2, 3].map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('peakHours')}</CardTitle>
                  <CardDescription>{t('peakHoursDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {stats.actions.peakHours.map((peak, index) => (
                      <div
                        key={peak.hour}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-lg border',
                          index === 0 && 'bg-primary/10 border-primary'
                        )}
                      >
                        <Clock className={cn('h-5 w-5', index === 0 ? 'text-primary' : 'text-muted-foreground')} />
                        <div>
                          <div className="font-semibold">{formatHour(peak.hour)}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('startsCount', { count: peak.count })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Servers Tab */}
            <TabsContent value="servers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('serverUsage')}</CardTitle>
                  <CardDescription>{t('serverUsageDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.servers.usage.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('noServerData')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.servers.usage.slice(0, 10).map((server, index) => (
                        <div key={server.serverId} className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{server.serverName}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('hoursOnline', { hours: server.hoursOnline })} • {server.avgRam} GB RAM
                            </div>
                          </div>
                          <div className="w-32">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${Math.min(100, (server.hoursOnline / (stats.servers.usage[0]?.hoursOnline || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('serverUsageChart')}</CardTitle>
                  <CardDescription>{t('serverUsageChartDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.servers.usage.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" stroke="currentColor" />
                        <YAxis
                          type="category"
                          dataKey="serverName"
                          className="text-xs"
                          stroke="currentColor"
                          width={100}
                          tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="hoursOnline" fill="#8b5cf6" name={t('hoursOnline', { hours: '' })} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab (Admin only) */}
            {stats.isAdmin && (
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('mostActiveUsers')}</CardTitle>
                    <CardDescription>{t('mostActiveUsersDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.users.activity.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('noUserData')}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stats.users.activity.map((user, index) => (
                          <div key={user.userId} className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {index + 1}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.photoUrl} />
                              <AvatarFallback>
                                {user.userName?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{user.userName}</div>
                              <div className="text-xs text-muted-foreground">
                                {t('actionsCount', { count: user.actionCount })}
                              </div>
                            </div>
                            <Badge variant="secondary">{user.actionCount}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
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
