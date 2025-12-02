import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ServerCardSkeletonProps {
  delay?: number;
}

export function ServerCardSkeleton({ delay = 0 }: ServerCardSkeletonProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-br from-card via-card to-card/80",
        "border border-border/50"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Status bar animada */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />
      
      <CardContent className="p-5 space-y-5">
        {/* Header: Icon + Info */}
        <div className="flex items-start gap-4">
          {/* Server icon skeleton */}
          <div className="relative flex-shrink-0">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-muted border-2 border-background" />
          </div>
          
          {/* Server info skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>

        {/* Status and players row */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        {/* Player capacity bar */}
        <Skeleton className="h-2 w-full rounded-full" />

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
