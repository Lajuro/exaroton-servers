'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';

/**
 * AdminSkeleton - Skeleton que replica fielmente a estrutura do Admin Panel
 * Inclui: Header, Search/Filter, Stats Cards, e User Cards
 */
export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section - Identical to real admin */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-40 md:w-48" />
              <Skeleton className="h-3 w-32 md:w-40" />
            </div>
          </div>
          <Skeleton className="h-9 w-9 sm:w-24 rounded-md" />
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 sm:gap-3">
          <Skeleton className="flex-1 h-9 sm:h-10 rounded-md" />
          <Skeleton className="w-[100px] sm:w-[140px] h-9 sm:h-10 rounded-md" />
        </div>

        {/* Stats Cards - 3 columns like dashboard */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {/* Users Card */}
          <Card className="relative border overflow-hidden">
            <CardContent className="p-2.5 sm:p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <Skeleton className="h-2.5 w-12 mx-auto sm:mx-0" />
                  <Skeleton className="h-7 sm:h-8 w-8 mx-auto sm:mx-0" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admins Card */}
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

          {/* Servers Card */}
          <Card className="relative border overflow-hidden">
            <CardContent className="p-2.5 sm:p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg" />
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <Skeleton className="h-2.5 w-14 mx-auto sm:mx-0" />
                  <Skeleton className="h-7 sm:h-8 w-8 mx-auto sm:mx-0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Cards Grid */}
        <div className="space-y-4">
          {/* Loading indicator */}
          <div className="flex items-center gap-2 px-1">
            <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* User Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <UserCardSkeleton key={i} delay={i * 100} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * UserCardSkeleton - Replica exata do User Card no admin
 */
function UserCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card 
      className="overflow-hidden border bg-card/50 backdrop-blur-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header: Avatar + Name + Role Badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              {/* Name */}
              <Skeleton className="h-5 w-28 sm:w-36" />
              {/* Email */}
              <Skeleton className="h-3 w-32 sm:w-40" />
            </div>
          </div>
          {/* Role Badge */}
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Server Access Section */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
