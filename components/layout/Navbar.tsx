'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LogOut, Shield, Gamepad2, Coins, RefreshCw, Loader2, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getUserInitials = () => {
    if (!user?.displayName) return 'U';
    return user.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchCredits = async () => {
    if (!user?.isAdmin) return;
    
    setLoadingCredits(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) return;

      const response = await fetch('/api/account', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchCredits();
    }
  }, [user?.isAdmin]);

  return (
    <TooltipProvider>
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5 sm:h-6 sm:w-6">
                <Image
                  src="/logo_msm.svg"
                  alt="MineServerManager Logo"
                  width={24}
                  height={24}
                  className="dark:invert-0 invert"
                  priority
                />
              </div>
              <h1 className="text-base sm:text-xl font-bold">
                <span className="hidden xs:inline">MineServer</span>
                <span className="xs:hidden">MS</span>
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Manager</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user?.isAdmin && (
                <div className="relative hidden sm:block">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 blur-lg animate-pulse-subtle" />
                  <Badge className="relative gap-1.5 pl-2 pr-3 py-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white border-0 shadow-lg shadow-amber-500/50 hover:shadow-amber-500/70 transition-shadow">
                    <Crown className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">Admin</span>
                  </Badge>
                </div>
              )}
              
              {user?.isAdmin && credits !== null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg border bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm cursor-help">
                      <div className="relative">
                        <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                        <div className="absolute -top-1 -right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 animate-pulse" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                        {credits.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchCredits}
                        disabled={loadingCredits}
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-amber-500/20"
                      >
                        {loadingCredits ? (
                          <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-amber-500" />
                        ) : (
                          <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 hover:rotate-180 transition-transform duration-500" />
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Créditos disponíveis na conta Exaroton</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <ThemeToggle />
              {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
