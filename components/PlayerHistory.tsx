'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  Users,
  Medal,
  Crown,
  Award,
  History,
  TrendingUp,
  Timer,
  RefreshCw,
  Loader2,
  Circle,
  Gamepad2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { auth } from '@/lib/firebase';
import { PlayerRankingEntry } from '@/types';

interface PlayerHistoryProps {
  serverId: string;
  serverName?: string;
  className?: string;
}

interface PlayerHistoryData {
  ranking: PlayerRankingEntry[];
  onlinePlayers: string[];
  totalUniquePlayers: number;
  lastOnlineAt?: Date;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formata tempo de jogo de forma amigável e acessível
 */
const formatPlaytime = (seconds: number | null | undefined, locale: string): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return '0s';
  }
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days < 7) {
    return `${days}d ${remainingHours}h`;
  }
  
  return locale === 'pt-BR' ? `${days} dias` : `${days} days`;
};

/**
 * Formata tempo de jogo para screen readers
 */
const formatPlaytimeAccessible = (seconds: number | null | undefined, locale: string): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return locale === 'pt-BR' ? '0 segundos' : '0 seconds';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (locale === 'pt-BR') {
    if (hours === 0) return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    return `${hours} hora${hours !== 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  if (hours === 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Formata data de última vez online
 */
const formatLastSeen = (date: Date | string | null | undefined, locale: string): string => {
  if (!date) {
    return locale === 'pt-BR' ? 'Desconhecido' : 'Unknown';
  }
  
  const lastSeen = new Date(date);
  
  if (isNaN(lastSeen.getTime())) {
    return locale === 'pt-BR' ? 'Desconhecido' : 'Unknown';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return locale === 'pt-BR' ? 'Agora' : 'Just now';
  }
  if (diffMins < 60) {
    return locale === 'pt-BR' ? `Há ${diffMins} min` : `${diffMins} min ago`;
  }
  if (diffHours < 24) {
    return locale === 'pt-BR' ? `Há ${diffHours}h` : `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return locale === 'pt-BR' 
      ? `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}` 
      : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  return lastSeen.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    day: 'numeric',
    month: 'short'
  });
};

/**
 * URL do avatar do jogador
 */
const getPlayerHeadUrl = (playerName: string, size: number = 32): string => {
  return `https://mc-heads.net/avatar/${encodeURIComponent(playerName)}/${size}`;
};

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

const RANK_STYLES = {
  1: {
    icon: Crown,
    bgClass: 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent',
    borderClass: 'border-amber-400/40',
    iconColor: 'text-amber-500',
    ringColor: 'ring-amber-400/60',
    label: 'Gold',
  },
  2: {
    icon: Medal,
    bgClass: 'bg-gradient-to-r from-slate-400/15 via-slate-300/10 to-transparent',
    borderClass: 'border-slate-400/40',
    iconColor: 'text-slate-400',
    ringColor: 'ring-slate-400/60',
    label: 'Silver',
  },
  3: {
    icon: Award,
    bgClass: 'bg-gradient-to-r from-amber-700/15 via-orange-600/10 to-transparent',
    borderClass: 'border-amber-600/40',
    iconColor: 'text-amber-600',
    ringColor: 'ring-amber-600/60',
    label: 'Bronze',
  },
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Ícone de ranking com estilos apropriados
 */
function RankBadge({ rank }: { rank: number }) {
  const isTopThree = rank <= 3;
  
  if (isTopThree) {
    const style = RANK_STYLES[rank as 1 | 2 | 3];
    const Icon = style.icon;
    
    return (
      <div 
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-xl',
          'border-2 transition-transform duration-200',
          'hover:scale-110',
          style.bgClass,
          style.borderClass
        )}
        role="img"
        aria-label={`Rank ${rank} - ${style.label}`}
      >
        <Icon className={cn('h-5 w-5', style.iconColor)} aria-hidden="true" />
      </div>
    );
  }
  
  return (
    <div 
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/50 border border-border/50"
      aria-label={`Rank ${rank}`}
    >
      <span className="text-sm font-bold text-muted-foreground tabular-nums">
        {rank}
      </span>
    </div>
  );
}

/**
 * Avatar do jogador com indicador de online
 */
function PlayerAvatar({ 
  playerName, 
  rank, 
  isOnline 
}: { 
  playerName: string; 
  rank: number;
  isOnline: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const isTopThree = rank <= 3;
  const ringColor = isTopThree ? RANK_STYLES[rank as 1 | 2 | 3].ringColor : 'ring-border';
  
  return (
    <div className="relative flex-shrink-0">
      <div 
        className={cn(
          'w-11 h-11 rounded-xl overflow-hidden',
          'ring-2 ring-offset-2 ring-offset-background',
          'transition-all duration-200',
          'group-hover:ring-4',
          ringColor
        )}
      >
        {!imageError ? (
          <img
            src={getPlayerHeadUrl(playerName, 88)}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-lg"
            aria-hidden="true"
          >
            {playerName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Online indicator */}
      {isOnline && (
        <div 
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-background flex items-center justify-center"
          role="status"
          aria-label="Online"
        >
          <span 
            className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" 
            aria-hidden="true" 
          />
        </div>
      )}
    </div>
  );
}

/**
 * Item individual do ranking de jogadores
 */
function PlayerRankItem({ 
  player, 
  locale,
  isOnline = false,
  maxPlaytime = 0,
  showProgress = true,
}: { 
  player: PlayerRankingEntry; 
  locale: string;
  isOnline?: boolean;
  maxPlaytime?: number;
  showProgress?: boolean;
}) {
  const t = useTranslations('servers.playerHistory');
  const isTopThree = player.rank <= 3;
  const progressValue = maxPlaytime > 0 ? (player.totalPlaytime / maxPlaytime) * 100 : 0;
  
  return (
    <div 
      className={cn(
        'group relative flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2',
        'transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        isTopThree ? RANK_STYLES[player.rank as 1 | 2 | 3].bgClass : 'bg-muted/20',
        isTopThree ? RANK_STYLES[player.rank as 1 | 2 | 3].borderClass : 'border-transparent hover:border-border/50'
      )}
      role="listitem"
      tabIndex={0}
      aria-label={`${player.rank}. ${player.playerName}, ${formatPlaytimeAccessible(player.totalPlaytime, locale)}, ${player.sessionCount} ${locale === 'pt-BR' ? 'sessões' : 'sessions'}`}
    >
      {/* Rank Badge */}
      <RankBadge rank={player.rank} />
      
      {/* Player Avatar */}
      <PlayerAvatar 
        playerName={player.playerName} 
        rank={player.rank}
        isOnline={isOnline}
      />
      
      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className={cn(
              'font-semibold truncate',
              player.rank === 1 && 'text-amber-600 dark:text-amber-400'
            )}
          >
            {player.playerName}
          </span>
          
          {isOnline && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 gap-1"
            >
              <Circle className="w-1.5 h-1.5 fill-current" aria-hidden="true" />
              <span>{t('online')}</span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>{formatPlaytime(player.totalPlaytime, locale)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Gamepad2 className="w-3 h-3" aria-hidden="true" />
            <span>{player.sessionCount} {t('sessions')}</span>
          </span>
        </div>
        
        {/* Progress Bar */}
        {showProgress && !isTopThree && (
          <Progress 
            value={progressValue} 
            className="h-1 mt-2" 
            aria-label={`${progressValue.toFixed(0)}% do tempo máximo`}
          />
        )}
      </div>
      
      {/* Last Seen */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-right flex-shrink-0">
              <span className="text-xs text-muted-foreground font-normal px-2 py-1 rounded-md bg-muted/50">
                {formatLastSeen(player.lastSeen, locale)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-xs">
              {t('lastSeen')}: {new Date(player.lastSeen).toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * Estado vazio quando não há jogadores
 */
function EmptyState() {
  const t = useTranslations('servers.playerHistory');
  
  return (
    <div 
      className="flex flex-col items-center justify-center py-12 text-center"
      role="status"
      aria-label={t('noPlayersYet')}
    >
      <div className="relative mb-6">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
          <Trophy className="h-10 w-10 text-amber-500/70" aria-hidden="true" />
        </div>
        <div 
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500/20 animate-pulse" 
          aria-hidden="true" 
        />
      </div>
      <p className="text-sm font-medium text-foreground/80">
        {t('noPlayersYet')}
      </p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        {t('noPlayersYetDesc')}
      </p>
    </div>
  );
}

/**
 * Estado de erro
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('servers.playerHistory');
  
  return (
    <div 
      className="flex flex-col items-center justify-center py-10 text-center"
      role="alert"
    >
      <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-destructive mb-3">
        {t('errorLoading')}
      </p>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onRetry}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {t('tryAgain')}
      </Button>
    </div>
  );
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================

/**
 * Skeleton para um item do ranking
 */
function PlayerRankItemSkeleton({ index }: { index: number }) {
  const isTopThree = index < 3;
  
  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2',
        isTopThree ? 'bg-muted/40' : 'bg-muted/20',
        'border-transparent'
      )}
    >
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

/**
 * Skeleton completo para o card de histórico
 */
export function PlayerHistorySkeleton() {
  return (
    <Card className="border-border/50 overflow-hidden animate-in fade-in-50 duration-500">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Skeleton className="h-10 w-full mb-4 rounded-lg" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <PlayerRankItemSkeleton key={i} index={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlayerHistoryCard({
  serverId,
  serverName,
  className = ''
}: PlayerHistoryProps) {
  const t = useTranslations('servers.playerHistory');
  const locale = useLocale();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlayerHistoryData | null>(null);
  const [activeTab, setActiveTab] = useState('ranking');

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/servers/${serverId}/players/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch player history');
      }

      const result = await response.json();
      setData({
        ranking: result.ranking || [],
        onlinePlayers: result.onlinePlayers || [],
        totalUniquePlayers: result.totalUniquePlayers || 0,
        lastOnlineAt: result.lastOnlineAt ? new Date(result.lastOnlineAt) : undefined,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching player history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized calculations
  const maxPlaytime = useMemo(() => {
    if (!data?.ranking.length) return 0;
    return Math.max(...data.ranking.map(p => p.totalPlaytime));
  }, [data?.ranking]);

  const recentPlayers = useMemo(() => {
    if (!data?.ranking.length) return [];
    return [...data.ranking]
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, 10)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [data?.ranking]);

  const onlinePlayers = useMemo(() => {
    return new Set(data?.onlinePlayers || []);
  }, [data?.onlinePlayers]);

  // Loading state
  if (loading) {
    return <PlayerHistorySkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("border-border/50 overflow-hidden", className)}>
        <CardContent className="pt-6">
          <ErrorState onRetry={() => fetchData()} />
        </CardContent>
      </Card>
    );
  }

  const { ranking, totalUniquePlayers, lastOnlineAt } = data || {
    ranking: [],
    totalUniquePlayers: 0,
  };

  return (
    <Card 
      className={cn("border-border/50 overflow-hidden animate-in fade-in-50 duration-300", className)}
      role="region"
      aria-label={t('playerRanking')}
    >
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
              <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
            </div>
            <span>{t('playerRanking')}</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="gap-1.5 py-1.5 px-3 bg-background/50 backdrop-blur-sm"
                  >
                    <Users className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span className="font-semibold">{totalUniquePlayers}</span>
                    <span className="text-muted-foreground font-normal hidden sm:inline">
                      {t('uniquePlayers')}
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('totalUniquePlayers', { count: totalUniquePlayers })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => fetchData(false)}
                    disabled={refreshing}
                    aria-label={refreshing ? t('refreshing') : t('refresh')}
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('refresh')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {ranking.length === 0 ? (
          <EmptyState />
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="w-full mb-4 h-11 p-1 bg-muted/50">
              <TabsTrigger 
                value="ranking" 
                className="flex-1 gap-2 data-[state=active]:bg-background"
              >
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('ranking')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="flex-1 gap-2 data-[state=active]:bg-background"
              >
                <Timer className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('recentPlayers')}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent 
              value="ranking" 
              className="space-y-2 mt-0 animate-in fade-in-50 duration-200"
            >
              <ol 
                className="space-y-2" 
                role="list" 
                aria-label={t('topPlayers')}
              >
                {ranking.slice(0, 10).map((player) => (
                  <PlayerRankItem 
                    key={player.playerName} 
                    player={player} 
                    locale={locale}
                    isOnline={onlinePlayers.has(player.playerName)}
                    maxPlaytime={maxPlaytime}
                    showProgress={true}
                  />
                ))}
              </ol>
              
              {ranking.length > 10 && (
                <p className="text-xs text-center text-muted-foreground pt-3 pb-1">
                  {t('andMorePlayers', { count: ranking.length - 10 })}
                </p>
              )}
            </TabsContent>
            
            <TabsContent 
              value="recent" 
              className="space-y-2 mt-0 animate-in fade-in-50 duration-200"
            >
              <ol 
                className="space-y-2" 
                role="list" 
                aria-label={t('recentlyActive')}
              >
                {recentPlayers.map((player) => (
                  <PlayerRankItem 
                    key={player.playerName} 
                    player={player} 
                    locale={locale}
                    isOnline={onlinePlayers.has(player.playerName)}
                    maxPlaytime={maxPlaytime}
                    showProgress={false}
                  />
                ))}
              </ol>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Last activity footer */}
        {lastOnlineAt && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {t('lastActive')}: {formatLastSeen(lastOnlineAt, locale)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXPORTED UTILITIES
// ============================================================================

/**
 * Badge de última vez online para uso em ServerCard
 */
export function LastOnlineBadge({ 
  lastOnlineAt, 
  serverStatus,
  className = '' 
}: { 
  lastOnlineAt?: Date | string; 
  serverStatus: number;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations('servers.playerHistory');
  
  // Se está online, mostra badge de online
  if (serverStatus === 1) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
          className
        )}
      >
        <Circle className="w-1.5 h-1.5 fill-current" aria-hidden="true" />
        {t('onlineNow')}
      </Badge>
    );
  }
  
  // Se não tem data, não mostra nada
  if (!lastOnlineAt) {
    return null;
  }
  
  const date = new Date(lastOnlineAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Determina a cor baseada em quão recente foi
  let colorClass = 'border-muted-foreground/30 text-muted-foreground';
  if (diffDays < 1) {
    colorClass = 'border-green-500/30 text-green-600 dark:text-green-400';
  } else if (diffDays < 3) {
    colorClass = 'border-blue-500/30 text-blue-600 dark:text-blue-400';
  } else if (diffDays < 7) {
    colorClass = 'border-amber-500/30 text-amber-600 dark:text-amber-400';
  }
  
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn("gap-1.5 text-xs", colorClass, className)}
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            {formatLastSeen(date, locale)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {t('lastOnline')}: {date.toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
