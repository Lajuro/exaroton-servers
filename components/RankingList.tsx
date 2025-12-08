'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Crown, Medal, Award, TrendingUp } from 'lucide-react';

interface RankingItem {
  id: string;
  name: string;
  value: number;
  subtitle?: string;
  imageUrl?: string;
  badge?: string;
  tooltipContent?: string;
}

interface RankingListProps {
  items: RankingItem[];
  maxValue?: number;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  showMedals?: boolean;
  showProgress?: boolean;
  showTrending?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  ariaLabel?: string;
}

const MEDAL_STYLES = {
  1: {
    icon: Crown,
    bgColor: 'bg-amber-500/20 dark:bg-amber-500/30',
    iconColor: 'text-amber-500',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/20',
  },
  2: {
    icon: Medal,
    bgColor: 'bg-slate-400/20 dark:bg-slate-400/30',
    iconColor: 'text-slate-400',
    borderColor: 'border-slate-400/50',
    glowColor: 'shadow-slate-400/20',
  },
  3: {
    icon: Award,
    bgColor: 'bg-amber-700/20 dark:bg-amber-700/30',
    iconColor: 'text-amber-700',
    borderColor: 'border-amber-700/50',
    glowColor: 'shadow-amber-700/20',
  },
} as const;

function RankingMedal({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <div 
        className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-semibold text-sm"
        aria-label={`Rank ${rank}`}
      >
        {rank}
      </div>
    );
  }

  const style = MEDAL_STYLES[rank as 1 | 2 | 3];
  const Icon = style.icon;

  return (
    <div 
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
        'hover:scale-110 hover:shadow-lg',
        style.bgColor,
        style.borderColor,
        style.glowColor
      )}
      role="img"
      aria-label={`Rank ${rank} - ${rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : 'Bronze'} medal`}
    >
      <Icon className={cn('h-5 w-5', style.iconColor)} aria-hidden="true" />
    </div>
  );
}

export function RankingList({
  items,
  maxValue,
  valueFormatter = (value) => value.toString(),
  emptyMessage = 'No data available',
  showMedals = true,
  showProgress = true,
  showTrending = false,
  variant = 'default',
  ariaLabel = 'Ranking list',
}: RankingListProps) {
  if (items.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 text-muted-foreground"
        role="status"
        aria-label={emptyMessage}
      >
        <TrendingUp className="h-12 w-12 mb-4 opacity-50" aria-hidden="true" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const calculatedMaxValue = maxValue ?? Math.max(...items.map(item => item.value));

  return (
    <TooltipProvider>
      <ol 
        className={cn(
          'space-y-3',
          variant === 'compact' && 'space-y-2'
        )}
        aria-label={ariaLabel}
        role="list"
      >
        {items.map((item, index) => {
          const rank = index + 1;
          const progressValue = calculatedMaxValue > 0 
            ? (item.value / calculatedMaxValue) * 100 
            : 0;
          const isTopThree = rank <= 3;

          return (
            <li
              key={item.id}
              className={cn(
                'group relative flex items-center gap-4 p-3 rounded-lg transition-all duration-200',
                'hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                isTopThree && variant !== 'compact' && 'p-4',
                rank === 1 && variant !== 'compact' && 'bg-gradient-to-r from-amber-500/10 to-transparent dark:from-amber-500/20'
              )}
              tabIndex={0}
              role="listitem"
              aria-label={`${rank}. ${item.name} - ${valueFormatter(item.value)}`}
            >
              {/* Rank Medal/Number */}
              {showMedals && (
                <div className="flex-shrink-0">
                  <RankingMedal rank={rank} />
                </div>
              )}

              {/* Avatar (optional) */}
              {item.imageUrl !== undefined && (
                <Avatar className={cn(
                  'flex-shrink-0 ring-2 ring-background',
                  isTopThree ? 'h-12 w-12' : 'h-10 w-10'
                )}>
                  <AvatarImage src={item.imageUrl} alt={`${item.name}'s avatar`} />
                  <AvatarFallback className="text-sm font-medium">
                    {item.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Name and Subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span 
                    className={cn(
                      'font-medium truncate',
                      isTopThree && 'font-semibold',
                      rank === 1 && 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {item.name}
                  </span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {showTrending && rank === 1 && (
                    <TrendingUp className="h-4 w-4 text-green-500" aria-label="Trending up" />
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.subtitle}
                  </p>
                )}

                {/* Progress Bar */}
                {showProgress && variant !== 'compact' && (
                  <div className="mt-2">
                    <Progress 
                      value={progressValue} 
                      className="h-1.5"
                      aria-label={`${progressValue.toFixed(0)}% of maximum`}
                    />
                  </div>
                )}
              </div>

              {/* Value */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      'flex-shrink-0 text-right',
                      isTopThree ? 'min-w-[60px]' : 'min-w-[50px]'
                    )}
                  >
                    <Badge 
                      variant={rank === 1 ? 'default' : 'secondary'}
                      className={cn(
                        'font-mono tabular-nums',
                        rank === 1 && 'bg-amber-500 hover:bg-amber-600 text-white'
                      )}
                    >
                      {valueFormatter(item.value)}
                    </Badge>
                  </div>
                </TooltipTrigger>
                {item.tooltipContent && (
                  <TooltipContent>
                    <p>{item.tooltipContent}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
          );
        })}
      </ol>
    </TooltipProvider>
  );
}
