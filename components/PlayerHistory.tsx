'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Star,
  History,
  TrendingUp,
  Timer,
  RefreshCw,
  Loader2,
  Circle
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

// Formatar tempo de jogo de forma amigável
const formatPlaytime = (seconds: number, locale: string): string => {
  if (seconds < 60) {
    return locale === 'pt-BR' ? `${seconds}s` : `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return locale === 'pt-BR' ? `${minutes} min` : `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days < 7) {
    return locale === 'pt-BR'
      ? `${days}d ${remainingHours}h`
      : `${days}d ${remainingHours}h`;
  }
  
  return locale === 'pt-BR'
    ? `${days} dias`
    : `${days} days`;
};

// Formatar data de última vez online
const formatLastSeen = (date: Date | string, locale: string): string => {
  const lastSeen = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return locale === 'pt-BR' ? 'Agora' : 'Just now';
  }
  if (diffMins < 60) {
    return locale === 'pt-BR' 
      ? `Há ${diffMins} min` 
      : `${diffMins} min ago`;
  }
  if (diffHours < 24) {
    return locale === 'pt-BR' 
      ? `Há ${diffHours}h` 
      : `${diffHours}h ago`;
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

// URL do avatar do jogador
const getPlayerHeadUrl = (playerName: string, size: number = 32) => {
  return `https://mc-heads.net/avatar/${playerName}/${size}`;
};

// Ícones de ranking
const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return <Crown className="h-5 w-5 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Medal className="h-5 w-5 text-slate-400" />;
  }
  if (rank === 3) {
    return <Medal className="h-5 w-5 text-amber-600" />;
  }
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
      {rank}
    </span>
  );
};

// Cores de fundo para o top 3
const getRankBgClass = (rank: number): string => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/20';
  if (rank === 2) return 'bg-gradient-to-r from-slate-400/10 to-slate-300/5 border-slate-400/20';
  if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 to-orange-500/5 border-amber-600/20';
  return 'bg-muted/30 border-transparent';
};

// Componente de jogador no ranking
const PlayerRankItem = ({ 
  player, 
  locale,
  isOnline = false
}: { 
  player: PlayerRankingEntry; 
  locale: string;
  isOnline?: boolean;
}) => {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations('servers.playerHistory');
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01]",
        getRankBgClass(player.rank)
      )}
    >
      {/* Posição */}
      <div className="w-8 flex items-center justify-center">
        <RankIcon rank={player.rank} />
      </div>
      
      {/* Avatar */}
      <div className="relative">
        <div 
          className={cn(
            "w-10 h-10 rounded-lg overflow-hidden ring-2 ring-offset-1 ring-offset-background",
            player.rank === 1 && "ring-yellow-500/50",
            player.rank === 2 && "ring-slate-400/50",
            player.rank === 3 && "ring-amber-600/50",
            player.rank > 3 && "ring-border"
          )}
        >
          {!imageError ? (
            <img
              src={getPlayerHeadUrl(player.playerName, 80)}
              alt={player.playerName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-500 to-slate-600 text-white font-bold">
              {player.playerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "font-semibold truncate",
            player.rank <= 3 && "text-foreground",
            player.rank > 3 && "text-foreground/90"
          )}>
            {player.playerName}
          </p>
          {isOnline && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
              <Circle className="w-1.5 h-1.5 fill-current mr-1" />
              {t('online')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatPlaytime(player.totalPlaytime, locale)}
          </span>
          <span className="flex items-center gap-1">
            <History className="w-3 h-3" />
            {player.sessionCount} {t('sessions')}
          </span>
        </div>
      </div>
      
      {/* Última vez visto */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {formatLastSeen(player.lastSeen, locale)}
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">
              {t('lastSeen')}: {new Date(player.lastSeen).toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

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
  const [data, setData] = useState<{
    ranking: PlayerRankingEntry[];
    onlinePlayers: string[];
    totalUniquePlayers: number;
    lastOnlineAt?: Date;
  } | null>(null);

  const fetchData = async (showLoader = true) => {
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
  };

  useEffect(() => {
    fetchData();
  }, [serverId]);

  if (loading) {
    return <PlayerHistorySkeleton />;
  }

  if (error) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">{t('errorLoading')}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => fetchData()}
          >
            {t('tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { ranking, onlinePlayers, totalUniquePlayers, lastOnlineAt } = data || {
    ranking: [],
    onlinePlayers: [],
    totalUniquePlayers: 0,
  };

  return (
    <Card className={cn("border-border/50 overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            {t('playerRanking')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Users className="w-3 h-3" />
              {totalUniquePlayers} {t('uniquePlayers')}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => fetchData(false)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('noPlayersYet')}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {t('noPlayersYetDesc')}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="ranking" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="ranking" className="flex-1 gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {t('ranking')}
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex-1 gap-1.5">
                <Timer className="w-4 h-4" />
                {t('recentPlayers')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ranking" className="space-y-2 mt-0">
              {ranking.slice(0, 10).map((player) => (
                <PlayerRankItem 
                  key={player.playerName} 
                  player={player} 
                  locale={locale}
                  isOnline={onlinePlayers.includes(player.playerName)}
                />
              ))}
              {ranking.length > 10 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  {t('andMorePlayers', { count: ranking.length - 10 })}
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="recent" className="space-y-2 mt-0">
              {ranking
                .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
                .slice(0, 10)
                .map((player, index) => (
                  <PlayerRankItem 
                    key={player.playerName} 
                    player={{ ...player, rank: index + 1 }} 
                    locale={locale}
                    isOnline={onlinePlayers.includes(player.playerName)}
                  />
                ))}
            </TabsContent>
          </Tabs>
        )}
        
        {/* Última vez online */}
        {lastOnlineAt && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {t('lastActive')}: {formatLastSeen(lastOnlineAt, locale)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton para carregamento
export const PlayerHistorySkeleton = () => (
  <Card className="border-border/50">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Export LastOnlineBadge para uso no ServerCard
export const LastOnlineBadge = ({ 
  lastOnlineAt, 
  serverStatus,
  className = '' 
}: { 
  lastOnlineAt?: Date | string; 
  serverStatus: number;
  className?: string;
}) => {
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
        <Circle className="w-1.5 h-1.5 fill-current" />
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
            <Clock className="w-3 h-3" />
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
};
