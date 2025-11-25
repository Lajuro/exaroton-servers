'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section Skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Search and Filter Skeleton */}
        <div className="flex gap-2 sm:gap-3">
          <Skeleton className="flex-1 h-9 sm:h-10" />
          <Skeleton className="w-[100px] sm:w-[140px] h-9 sm:h-10" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border">
              <CardContent className="p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                  <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <Skeleton className="h-3 w-12 mx-auto sm:mx-0" />
                    <Skeleton className="h-8 w-10 mx-auto sm:mx-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Server Cards Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ServerCardSkeletonFull key={i} delay={i * 100} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Skeleton completo do ServerCard
function ServerCardSkeletonFull({ delay = 0 }: { delay?: number }) {
  return (
    <Card 
      className="overflow-hidden border animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Status bar */}
      <div className="h-1 bg-muted" />
      
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Stats */}
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

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton mínimo (só os cards)
export function DashboardCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Skeleton className="h-4 w-4 rounded-full animate-spin" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <ServerCardSkeletonFull key={i} delay={i * 100} />
        ))}
      </div>
    </div>
  );
}
