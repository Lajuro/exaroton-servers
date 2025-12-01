'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface GlobalLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function GlobalLoading({ message, fullScreen = true }: GlobalLoadingProps) {
  const t = useTranslations('common');
  const displayMessage = message ?? t('loading');
  
  return (
    <div 
      className={cn(
        "flex items-center justify-center bg-background",
        fullScreen && "fixed inset-0 z-50"
      )}
    >
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-green-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Loading content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo with animation */}
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse scale-150" />
          
          {/* Spinning ring */}
          <div className="absolute inset-[-8px] rounded-full border-2 border-transparent border-t-primary animate-spin" />
          
          {/* Logo container */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm">
            <Image
              src="/logo_msm.svg"
              alt="MineServerManager"
              width={48}
              height={48}
              className="h-12 w-12 invert dark:invert-0 animate-pulse"
              priority
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            MineServerManager
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{displayMessage}</span>
            <LoadingDots />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}

// Animated dots component
function LoadingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

// Mini loading for inline use
export function MiniLoading({ className }: { className?: string }) {
  const t = useTranslations('common');
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
      <span className="text-sm text-muted-foreground">{t('loading')}</span>
    </div>
  );
}
