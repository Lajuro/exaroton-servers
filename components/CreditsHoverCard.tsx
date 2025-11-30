'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  Coins,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  FileText,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  ArrowDown,
  CalendarDays,
  CalendarRange,
  Pin,
  PinOff,
} from 'lucide-react';
import { CreditSpending, DailySpending } from '@/types';

interface CreditHistoryData {
  currentCredits: number;
  spending: {
    day: CreditSpending;
    threeDays: CreditSpending;
    week: CreditSpending;
    month: CreditSpending;
  };
  dailyBreakdown: DailySpending[];
  totalSnapshots: number;
  lastSnapshot: {
    id: string;
    credits: number;
    timestamp: string;
    type: string;
  } | null;
}

interface CreditsHoverCardProps {
  onGenerateReport: () => void;
}

export function CreditsHoverCard({ onGenerateReport }: CreditsHoverCardProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [history, setHistory] = useState<CreditHistoryData | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [displayCredits, setDisplayCredits] = useState<number | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Real-time tracking states
  const [realTimeStartCredits, setRealTimeStartCredits] = useState<number | null>(null);
  const [realTimeStartTime, setRealTimeStartTime] = useState<Date | null>(null);
  const [realTimeElapsed, setRealTimeElapsed] = useState<string>('00:00:00');

  // Fetch current credits
  const fetchCredits = useCallback(async () => {
    setLoadingCredits(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) return;

      const response = await fetch('/api/account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        setDisplayCredits(data.credits);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Erro ao buscar créditos');
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  // Fetch credit history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) return;

      const response = await fetch('/api/credits/history', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
        setCredits(data.currentCredits);
        setDisplayCredits(data.currentCredits);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Create snapshot
  const createSnapshot = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) return;

      await fetch('/api/credits/snapshot', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'manual' }),
      });

      // Refresh history after creating snapshot
      fetchHistory();
    } catch (err) {
      console.error('Error creating snapshot:', err);
    }
  }, [fetchHistory]);

  // Toggle real-time mode
  const toggleRealTime = useCallback(async () => {
    if (!realTimeEnabled) {
      // Starting real-time mode - fetch fresh credits first
      setLoadingCredits(true);
      try {
        const token = await auth.currentUser?.getIdToken(true);
        if (!token) return;

        const response = await fetch('/api/account', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
          setDisplayCredits(data.credits);
          setRealTimeStartCredits(data.credits);
          setRealTimeStartTime(new Date());
          setRealTimeEnabled(true);
        }
      } catch (err) {
        console.error('Error starting real-time:', err);
      } finally {
        setLoadingCredits(false);
      }
    } else {
      // Stopping real-time mode
      setRealTimeEnabled(false);
      setRealTimeStartCredits(null);
      setRealTimeStartTime(null);
      setRealTimeElapsed('00:00:00');
      // Fetch fresh credits
      fetchCredits();
    }
  }, [realTimeEnabled, fetchCredits]);

  // Real-time credits tracking
  useEffect(() => {
    if (realTimeEnabled && realTimeStartCredits !== null && realTimeStartTime && history) {
      // Calculate credit burn rate per second based on average spending
      const avgPerHour = history.spending.day.averagePerHour || history.spending.week.averagePerHour || 0;
      const creditsPerSecond = avgPerHour / 3600;

      const updateInterval = setInterval(async () => {
        // Update elapsed time
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - realTimeStartTime.getTime()) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setRealTimeElapsed(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );

        // Estimate current credits based on burn rate
        if (creditsPerSecond > 0) {
          const estimatedSpent = creditsPerSecond * elapsed;
          setDisplayCredits(Math.max(0, realTimeStartCredits - estimatedSpent));
        }
      }, 1000);

      // Also fetch real credits periodically (every 30 seconds)
      const fetchInterval = setInterval(async () => {
        try {
          const token = await auth.currentUser?.getIdToken(true);
          if (!token) return;

          const response = await fetch('/api/account', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setCredits(data.credits);
            setDisplayCredits(data.credits);
          }
        } catch (err) {
          console.error('Error fetching real-time credits:', err);
        }
      }, 30000);

      realTimeIntervalRef.current = updateInterval;

      return () => {
        clearInterval(updateInterval);
        clearInterval(fetchInterval);
      };
    } else {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
        realTimeIntervalRef.current = null;
      }
      if (!realTimeEnabled) {
        setDisplayCredits(credits);
      }
    }
  }, [realTimeEnabled, realTimeStartCredits, realTimeStartTime, history, credits]);

  // Calculate spent in real-time session
  const realTimeSpent = realTimeEnabled && realTimeStartCredits !== null && displayCredits !== null
    ? Math.max(0, realTimeStartCredits - displayCredits)
    : 0;

  // Initial fetch
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const formatCredits = (value: number) => {
    return value.toFixed(2);
  };

  const formatCurrency = (credits: number) => {
    // 1 credit = €0.01
    return `€${(credits * 0.01).toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SpendingCard = ({
    title,
    icon: Icon,
    spending,
    isLoading,
  }: {
    title: string;
    icon: React.ElementType;
    spending?: CreditSpending;
    isLoading: boolean;
  }) => (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-4 w-16" />
      ) : spending ? (
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3 w-3 text-red-500" />
          <span className="text-sm font-bold text-red-500">
            -{formatCredits(spending.spent)}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )}
    </div>
  );

  return (
    <HoverCard 
      openDelay={200} 
      closeDelay={100}
      open={isPinned ? true : isOpen}
      onOpenChange={(open: boolean) => {
        if (!isPinned) {
          setIsOpen(open);
        }
      }}
    >
      <HoverCardTrigger asChild>
        <button
          onClick={fetchCredits}
          disabled={loadingCredits}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            'bg-gradient-to-r from-emerald-500/10 to-green-500/10',
            'border border-emerald-500/20 hover:border-emerald-500/40',
            'transition-all duration-300 group',
            isPinned && 'ring-2 ring-emerald-500/50'
          )}
        >
          <div className="relative">
            <Coins className="h-4 w-4 text-emerald-500" />
            {realTimeEnabled && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            {!realTimeEnabled && !loadingCredits && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <span
            className={cn(
              'text-sm font-bold tabular-nums transition-colors',
              realTimeEnabled
                ? 'text-red-500 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {loadingCredits ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : displayCredits !== null ? (
              formatCredits(displayCredits)
            ) : (
              '-'
            )}
          </span>
          <RefreshCw
            className={cn(
              'h-3 w-3 text-emerald-500/50 group-hover:text-emerald-500 transition-all',
              loadingCredits && 'animate-spin'
            )}
          />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Coins className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Créditos Exaroton</h4>
                <p className="text-xs text-muted-foreground">
                  Monitoramento de gastos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={isPinned ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  'h-8 w-8',
                  isPinned && 'bg-emerald-500 hover:bg-emerald-600'
                )}
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Desafixar' : 'Fixar aberto'}
              >
                {isPinned ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  fetchCredits();
                  fetchHistory();
                }}
                disabled={loadingCredits || loadingHistory}
              >
                <RefreshCw
                  className={cn(
                    'h-4 w-4',
                    (loadingCredits || loadingHistory) && 'animate-spin'
                  )}
                />
              </Button>
            </div>
          </div>

          {/* Current Balance */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Saldo Atual</span>
              {displayCredits !== null && (
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(displayCredits)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  realTimeEnabled ? 'text-red-500' : 'text-emerald-500'
                )}
              >
                {displayCredits !== null ? formatCredits(displayCredits) : '-'}
              </span>
              <Badge variant="outline" className="text-xs">
                créditos
              </Badge>
            </div>
          </div>

          {/* Real-time Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Modo Tempo Real</span>
              </div>
              <Button
                variant={realTimeEnabled ? 'destructive' : 'outline'}
                size="sm"
                className="h-7 gap-1.5"
                onClick={toggleRealTime}
                disabled={loadingCredits}
              >
                {loadingCredits ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : realTimeEnabled ? (
                  <>
                    <Pause className="h-3 w-3" />
                    Parar
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Iniciar
                  </>
                )}
              </Button>
            </div>

            {/* Real-time Monitoring Panel */}
            {realTimeEnabled && realTimeStartCredits !== null && (
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-3">
                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-lg font-mono font-bold tabular-nums">
                    {realTimeElapsed}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Started With */}
                  <div className="p-2 rounded bg-muted/50">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Início
                    </span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatCredits(realTimeStartCredits)}
                    </span>
                  </div>

                  {/* Current */}
                  <div className="p-2 rounded bg-red-500/10">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Atual
                    </span>
                    <span className="text-sm font-bold text-red-500 tabular-nums">
                      {displayCredits !== null ? formatCredits(displayCredits) : '-'}
                    </span>
                  </div>

                  {/* Spent */}
                  <div className="p-2 rounded bg-red-500/20">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Gasto
                    </span>
                    <span className="text-sm font-bold text-red-600 tabular-nums">
                      -{formatCredits(realTimeSpent)}
                    </span>
                  </div>
                </div>

                {/* Money equivalent */}
                <div className="text-center pt-1 border-t border-red-500/20">
                  <span className="text-xs text-muted-foreground">
                    Equivalente: <span className="text-red-500 font-semibold">{formatCurrency(realTimeSpent)}</span> gastos
                  </span>
                </div>

                {/* Info */}
                <p className="text-[10px] text-muted-foreground text-center">
                  Atualiza automaticamente a cada 30s • Estimativa baseada na média de gasto
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">{error}</span>
            </div>
          )}

          <Separator />

          {/* Spending Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold flex items-center gap-1.5">
                <ArrowDown className="h-4 w-4" />
                Resumo de Gastos
              </h5>
              {!history && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                >
                  Carregar
                </Button>
              )}
            </div>

            <SpendingCard
              title="Hoje"
              icon={Calendar}
              spending={history?.spending.day}
              isLoading={loadingHistory}
            />
            <SpendingCard
              title="Últimos 3 dias"
              icon={CalendarDays}
              spending={history?.spending.threeDays}
              isLoading={loadingHistory}
            />
            <SpendingCard
              title="Última semana"
              icon={CalendarRange}
              spending={history?.spending.week}
              isLoading={loadingHistory}
            />
          </div>

          {/* Averages */}
          {history && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground block">
                  Média/Dia
                </span>
                <span className="text-sm font-bold">
                  {formatCredits(history.spending.week.averagePerDay)}/dia
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground block">
                  Média/Hora
                </span>
                <span className="text-sm font-bold">
                  {formatCredits(history.spending.week.averagePerHour)}/h
                </span>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={createSnapshot}
            >
              <BarChart3 className="h-4 w-4" />
              Salvar Snapshot
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onGenerateReport}
            >
              <FileText className="h-4 w-4" />
              Relatório
            </Button>
          </div>

          {/* Last Snapshot Info */}
          {history?.lastSnapshot && (
            <p className="text-xs text-muted-foreground text-center">
              Último snapshot: {formatDate(history.lastSnapshot.timestamp)}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
