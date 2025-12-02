'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import { Separator } from '@/components/ui/separator';

/**
 * ServerDetailSkeleton - Skeleton que replica fielmente a página de detalhes do servidor
 * Inclui: Banner, Header Card com glassmorphism, Grid com Instruções/Console e Sidebar
 */
export function ServerDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner Skeleton */}
      <div className="relative">
        {/* Banner image area */}
        <div className="h-48 sm:h-64 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        
        {/* Gradient overlay (same as real page) */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Back button */}
        <Skeleton className="absolute top-4 left-4 h-9 w-28 rounded-md bg-black/20 backdrop-blur-md" />
      </div>

      {/* Main content - overlapping banner */}
      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-12">
        {/* Header Card with glassmorphism effect */}
        <Card className="mb-6 overflow-hidden bg-background/70 backdrop-blur-xl border-white/10">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Server Icon */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <Skeleton className="h-[120px] w-[120px] rounded-xl" />
                  {/* Status indicator dot */}
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-muted border-4 border-background animate-pulse" />
                </div>
              </div>
              
              {/* Server Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Server Name */}
                    <Skeleton className="h-9 w-64 md:w-80" />
                    
                    {/* Description */}
                    <Skeleton className="h-4 w-full max-w-md" />
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-7 w-20 rounded-full" />
                      <Skeleton className="h-7 w-28 rounded-full" />
                    </div>

                    {/* Server Address Box */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg w-fit">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Players progress bar */}
          <div className="h-1 bg-muted/50">
            <div className="h-full w-1/3 bg-gradient-to-r from-muted via-muted/70 to-muted animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </Card>

        {/* Main Grid: 2 columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Access Instructions Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>

            {/* Console Card (for admins) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Console output area */}
                <Skeleton className="h-64 w-full rounded-lg mb-4" />
                {/* Command input */}
                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-10 rounded-md" />
                  <Skeleton className="h-10 w-20 rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Server Controls Card */}
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Control buttons grid */}
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
                {/* Additional controls */}
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Server Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Info rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                    {i < 5 && <Separator className="my-2" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
