'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Users, Circle, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface OnlinePlayersProps {
  players: string[];
  maxPlayers: number;
  serverStatus: number;
  compact?: boolean;
  className?: string;
}

// Função para gerar URL do avatar do Minecraft
const getPlayerHeadUrl = (playerName: string, size: number = 32) => {
  return `https://mc-heads.net/avatar/${playerName}/${size}`;
};

// Componente de avatar do jogador com fallback
const PlayerAvatar = ({ 
  playerName, 
  size = 32,
  showTooltip = true,
  className = ''
}: { 
  playerName: string; 
  size?: number;
  showTooltip?: boolean;
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  const avatar = (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg ring-2 ring-offset-1 ring-offset-background",
        "transition-all duration-200 hover:scale-110 hover:ring-primary",
        "ring-emerald-500/30",
        className
      )}
      style={{ width: size, height: size }}
    >
      {!imageError ? (
        <img
          src={getPlayerHeadUrl(playerName, size * 2)}
          alt={playerName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-xs"
        >
          {playerName.charAt(0).toUpperCase()}
        </div>
      )}
      
      {/* Online indicator */}
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background">
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
      </div>
    </div>
  );

  if (!showTooltip) return avatar;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatar}
        </TooltipTrigger>
        <TooltipContent side="top" className="font-medium">
          <div className="flex items-center gap-2">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
            {playerName}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Componente de lista compacta (para ServerCard)
export const OnlinePlayersCompact = ({ 
  players, 
  maxShow = 5,
  className = ''
}: { 
  players: string[]; 
  maxShow?: number;
  className?: string;
}) => {
  const displayPlayers = players.slice(0, maxShow);
  const remainingCount = players.length - maxShow;

  if (players.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex -space-x-2">
        {displayPlayers.map((player) => (
          <PlayerAvatar 
            key={player} 
            playerName={player} 
            size={24} 
            className="ring-1"
          />
        ))}
      </div>
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-6">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

// Componente principal de jogadores online
export default function OnlinePlayers({
  players,
  maxPlayers,
  serverStatus,
  compact = false,
  className = ''
}: OnlinePlayersProps) {
  const t = useTranslations('servers.playerHistory');
  const isOnline = serverStatus === 1;
  const playersPercentage = maxPlayers > 0 ? (players.length / maxPlayers) * 100 : 0;

  if (!isOnline) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted/50 border border-muted-foreground/20">
              <Users className="h-4 w-4 text-muted-foreground" />
            </span>
            {t('onlinePlayers')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Gamepad2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('serverOffline')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted/50 border border-muted-foreground/20">
              <Users className="h-4 w-4 text-muted-foreground" />
            </span>
            {t('onlinePlayers')}
            <Badge variant="outline" className="ml-auto">
              0/{maxPlayers}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('noPlayersOnline')}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {t('waitingForPlayers')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <OnlinePlayersCompact 
          players={players} 
        />
        <span className="text-sm text-muted-foreground">
          {players.length}/{maxPlayers}
        </span>
      </div>
    );
  }

  return (
    <Card className={cn("border-border/50 overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2.5 text-lg">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Users className="h-4 w-4 text-emerald-500" />
          </span>
          {t('onlinePlayers')}
          <Badge 
            variant="outline" 
            className={cn(
              "ml-auto gap-1.5",
              playersPercentage > 80 && "border-amber-500/50 text-amber-600 dark:text-amber-400",
              playersPercentage === 100 && "border-red-500/50 text-red-600 dark:text-red-400"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {players.length}/{maxPlayers}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Lista de jogadores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map((player) => (
            <div 
              key={player}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 group"
            >
              <PlayerAvatar 
                playerName={player} 
                size={36} 
                showTooltip={false}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {player}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                  {t('online')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de progresso */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t('serverCapacity')}</span>
            <span>{Math.round(playersPercentage)}%</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                "bg-gradient-to-r from-emerald-500 to-green-400",
                playersPercentage > 80 && "from-amber-500 to-orange-400",
                playersPercentage === 100 && "from-red-500 to-rose-400"
              )}
              style={{ width: `${playersPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para carregamento
export const OnlinePlayersSkeleton = () => (
  <Card className="border-border/50">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 ml-auto" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
