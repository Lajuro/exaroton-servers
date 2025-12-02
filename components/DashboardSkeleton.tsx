'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';

/**
 * DashboardSkeleton - Skeleton que replica fielmente a estrutura do Dashboard
 * Inclui: Header, Search/Filter, Stats Cards, e Server Cards
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section - Identical to real dashboard */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-32 md:w-40" />
              <Skeleton className="h-3 w-24 md:w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-9 sm:w-24 rounded-md" />
        </div>

        {/* Search and Filter - Exact layout */}
        <div className="flex gap-2 sm:gap-3">
          <Skeleton className="flex-1 h-9 sm:h-10 rounded-md" />
          <Skeleton className="w-[100px] sm:w-[140px] h-9 sm:h-10 rounded-md" />
        </div>

        {/* Stats Cards - Identical 3-column grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {/* Total Servers Card */}
          <Card className="relative border overflow-hidden">
            <CardContent className="p-2.5 sm:p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <Skeleton className="h-2.5 w-10 mx-auto sm:mx-0" />
                  <Skeleton className="h-7 sm:h-8 w-8 mx-auto sm:mx-0" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online Card */}
          <Card className="relative border overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-muted/50 via-muted to-muted/50 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <CardContent className="p-2.5 sm:p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <Skeleton className="h-2.5 w-10 mx-auto sm:mx-0" />
                  <Skeleton className="h-7 sm:h-8 w-6 mx-auto sm:mx-0" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card className="relative border overflow-hidden">
            <CardContent className="p-2.5 sm:p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <Skeleton className="h-2.5 w-12 mx-auto sm:mx-0" />
                  <Skeleton className="h-7 sm:h-8 w-10 mx-auto sm:mx-0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Cards Grid */}
        <div className="space-y-4">
          {/* Loading indicator */}
          <div className="flex items-center gap-2 px-1">
            <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Server Cards - Responsive grid matching real layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ServerCardSkeleton key={i} delay={i * 100} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * ServerCardSkeleton - Replica exata do ServerCard
 */
function ServerCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card 
      className="overflow-hidden border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Status bar at top */}
      <div className="h-1 bg-gradient-to-r from-muted via-muted/70 to-muted animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
      
      <CardContent className="p-4 space-y-4">
        {/* Header: Icon + Name + Status Badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Server Icon */}
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              {/* Server Name */}
              <Skeleton className="h-5 w-28 sm:w-36" />
              {/* Server Address */}
              <Skeleton className="h-3 w-24 sm:w-32" />
            </div>
          </div>
          {/* Status Badge */}
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Stats Row: Players + Software */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* RAM Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * DashboardCardsSkeleton - Apenas os cards (sem navbar) para uso em refresh
 */
export function DashboardCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <ServerCardSkeleton key={i} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}
