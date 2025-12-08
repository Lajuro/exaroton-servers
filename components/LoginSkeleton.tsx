'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * LoginSkeleton - Skeleton que replica a estrutura da página de login
 * Inclui: Background effects, Logo, Feature cards, e Login button
 */
export function LoginSkeleton() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Theme Toggle & Language - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      
      {/* Background gradient orbs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col lg:flex-row">
        {/* Left Side - Branding & Features */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-lg mx-auto lg:mx-0 space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse" />
                <Skeleton className="relative w-14 h-14 rounded-2xl" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-4">
              <Skeleton className="h-12 w-full max-w-md" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-5 w-full max-w-sm" />
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Card (desktop) */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 lg:p-16">
          <div className="relative w-full max-w-md">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-green-500/10 rounded-3xl blur-xl" />
            
            {/* Card */}
            <div className="relative p-8 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 space-y-6">
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>

              {/* Google Login Button */}
              <Skeleton className="h-12 w-full rounded-xl" />

              {/* Footer */}
              <div className="space-y-2">
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-3 w-3/4 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Login Button (fixed at bottom) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-3 w-48 mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
}
