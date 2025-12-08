'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  tooltipContent?: string;
  variant?: 'default' | 'gradient' | 'outline';
  colorScheme?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  valueClassName?: string;
  isLoading?: boolean;
}

const COLOR_SCHEMES = {
  default: {
    gradient: 'from-primary/10 via-primary/5 to-transparent',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    valueColor: 'text-foreground',
    trendUp: 'text-green-500',
    trendDown: 'text-red-500',
  },
  success: {
    gradient: 'from-green-500/10 via-green-500/5 to-transparent',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
    valueColor: 'text-green-600 dark:text-green-400',
    trendUp: 'text-green-500',
    trendDown: 'text-red-500',
  },
  warning: {
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    valueColor: 'text-amber-600 dark:text-amber-400',
    trendUp: 'text-green-500',
    trendDown: 'text-red-500',
  },
  danger: {
    gradient: 'from-red-500/10 via-red-500/5 to-transparent',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    valueColor: 'text-red-600 dark:text-red-400',
    trendUp: 'text-red-500',
    trendDown: 'text-green-500',
  },
  info: {
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-600 dark:text-blue-400',
    trendUp: 'text-green-500',
    trendDown: 'text-red-500',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  tooltipContent,
  variant = 'default',
  colorScheme = 'default',
  className,
  valueClassName,
  isLoading = false,
}: StatCardProps) {
  const colors = COLOR_SCHEMES[colorScheme];

  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
    ? TrendingDown 
    : Minus;

  const trendColor = trend?.direction === 'up'
    ? colors.trendUp
    : trend?.direction === 'down'
    ? colors.trendDown
    : 'text-muted-foreground';

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-0.5',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          variant === 'gradient' && `bg-gradient-to-br ${colors.gradient}`,
          variant === 'outline' && 'border-2',
          className
        )}
        tabIndex={0}
        role="article"
        aria-label={`${title}: ${value}`}
      >
        {/* Decorative gradient overlay */}
        {variant === 'gradient' && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/80 pointer-events-none" 
            aria-hidden="true"
          />
        )}

        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <CardDescription className="flex items-center gap-2 font-medium">
              {icon && (
                <span 
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-transform duration-200 group-hover:scale-110',
                    colors.iconBg,
                    colors.iconColor
                  )}
                  aria-hidden="true"
                >
                  {icon}
                </span>
              )}
              <span className="text-sm">{title}</span>
            </CardDescription>
            
            {tooltipContent && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label="More information"
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <>
              <div 
                className={cn(
                  'text-3xl font-bold tracking-tight tabular-nums',
                  colors.valueColor,
                  valueClassName
                )}
                aria-live="polite"
              >
                {value}
              </div>

              {(subtitle || trend) && (
                <div className="flex items-center gap-2 mt-1">
                  {trend && (
                    <span 
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        trendColor
                      )}
                      aria-label={`Trend: ${trend.direction} ${trend.value}`}
                    >
                      <TrendIcon className="h-3 w-3" aria-hidden="true" />
                      {trend.direction !== 'neutral' && (
                        <span>
                          {trend.direction === 'up' ? '+' : '-'}
                          {Math.abs(trend.value)}
                        </span>
                      )}
                    </span>
                  )}
                  {subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {trend && <span aria-hidden="true">• </span>}
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>

        {/* Animated border on hover */}
        <div 
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r',
            'from-transparent via-primary to-transparent',
            'transform scale-x-0 transition-transform duration-300',
            'group-hover:scale-x-100'
          )}
          aria-hidden="true"
        />
      </Card>
    </TooltipProvider>
  );
}
