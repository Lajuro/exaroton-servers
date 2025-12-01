'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/theme-toggle';
import { CreditsHoverCard } from '@/components/CreditsHoverCard';
import { CreditReportDialog } from '@/components/CreditReportDialog';
import { OnlineStatus } from '@/components/PWAInstallPrompt';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

import { 
  LogOut, 
  Shield, 
  Crown,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Detectar scroll para efeito de backdrop
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    ...(user?.isAdmin ? [{ href: '/admin', label: t('admin'), icon: Shield }] : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <TooltipProvider>
      <nav className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-background/80 backdrop-blur-xl border-b shadow-sm" 
          : "bg-background/50 backdrop-blur-sm border-b border-transparent"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group-hover:border-primary/40 transition-colors">
                  <Image
                    src="/logo_msm.svg"
                    alt="MineServerManager Logo"
                    width={20}
                    height={20}
                    className="invert dark:invert-0"
                    priority
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold leading-none">
                  <span className="text-foreground">MineServer</span>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Manager</span>
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium">{t('controlPanel')}</p>
              </div>
            </Link>

            {/* Center Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "relative gap-2 font-medium transition-all",
                        isActive(link.href) 
                          ? "bg-primary/10 text-primary hover:bg-primary/15" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                      {isActive(link.href) && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-primary rounded-full" />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Badge - Mobile */}
              {user?.isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden sm:flex items-center">
                      <Badge 
                        variant="outline" 
                        className="gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      >
                        <Crown className="h-3 w-3" />
                        <span className="text-xs font-semibold">Admin</span>
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{t('adminPrivileges')}</TooltipContent>
                </Tooltip>
              )}

              {/* Credits Display with HoverCard */}
              {user?.isAdmin && (
                <CreditsHoverCard onGenerateReport={() => setReportDialogOpen(true)} />
              )}

              {/* Offline Status Indicator */}
              <OnlineStatus />

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {user.isAdmin && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          <Crown className="h-2.5 w-2.5 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Navigation Links */}
                    <DropdownMenuItem 
                      onClick={() => router.push('/dashboard')}
                      className="gap-3 py-2.5 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-md bg-blue-500/10">
                        <LayoutDashboard className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{t('dashboard')}</p>
                        <p className="text-xs text-muted-foreground">{t('viewServers')}</p>
                      </div>
                    </DropdownMenuItem>

                    {user?.isAdmin && (
                      <DropdownMenuItem 
                        onClick={() => router.push('/admin')}
                        className="gap-3 py-2.5 cursor-pointer"
                      >
                        <div className="p-1.5 rounded-md bg-amber-500/10">
                          <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium">{t('adminPanel')}</p>
                          <p className="text-xs text-muted-foreground">{t('manageUsers')}</p>
                        </div>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="my-2" />

                    {/* Logout */}
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="gap-3 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <div className="p-1.5 rounded-md bg-destructive/10">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{t('logout')}</p>
                        <p className="text-xs opacity-70">{t('endSession')}</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar effect - optional visual flair */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </nav>

      {/* Credit Report Dialog */}
      <CreditReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
    </TooltipProvider>
  );
}
