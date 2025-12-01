'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GlobalLoading } from '@/components/GlobalLoading';
import Image from 'next/image';
import { 
  Loader2, 
  Zap, 
  Shield, 
  Users, 
  Terminal,
  Gamepad2,
  Globe,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Partículas flutuantes animadas
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20 animate-float"
          style={{
            width: Math.random() * 10 + 5 + 'px',
            height: Math.random() * 10 + 5 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 5 + 's',
            animationDuration: Math.random() * 10 + 10 + 's',
          }}
        />
      ))}
    </div>
  );
}

// Grid animado de fundo
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
}

// Ícones de Minecraft flutuantes
function MinecraftIcons() {
  const icons = ['⛏️', '🗡️', '🛡️', '💎', '🔥', '⭐', '🎮', '🌍'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, i) => (
        <div
          key={i}
          className="absolute text-2xl opacity-20 animate-float-slow"
          style={{
            left: `${10 + (i * 12)}%`,
            top: `${20 + Math.sin(i) * 30}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${15 + i * 2}s`,
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
}

// Feature card
function FeatureCard({ icon: Icon, title, description, delay }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay: number;
}) {
  return (
    <div 
      className="group flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-2 rounded-lg bg-primary/20 text-primary group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return <GlobalLoading message={tCommon('verifyingAuth')} />;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Theme Toggle & Language - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      
      {/* Background Effects */}
      <AnimatedGrid />
      <FloatingParticles />
      <MinecraftIcons />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/30 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col lg:flex-row">
        {/* Left Side - Branding & Features */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-16">
          <div className={cn(
            "max-w-lg mx-auto lg:mx-0 space-y-8 transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/50 blur-xl rounded-full animate-pulse" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg shadow-primary/25 border border-primary/20">
                  <Image 
                    src="/logo_msm.svg" 
                    alt="MineServerManager Logo" 
                    width={32} 
                    height={32}
                    className="h-8 w-8 invert dark:invert-0"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  MineServerManager
                </h1>
                <p className="text-sm text-muted-foreground">{t('controlPanel')}</p>
              </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                {t('heroTitle')}{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Minecraft
                </span>
                {' '}{t('heroTitleEnd')}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('heroDescription')}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FeatureCard 
                icon={Zap} 
                title={t('features.realtime.title')} 
                description={t('features.realtime.description')}
                delay={100}
              />
              <FeatureCard 
                icon={Terminal} 
                title={t('features.commands.title')} 
                description={t('features.commands.description')}
                delay={200}
              />
              <FeatureCard 
                icon={Shield} 
                title={t('features.secure.title')} 
                description={t('features.secure.description')}
                delay={300}
              />
              <FeatureCard 
                icon={Users} 
                title={t('features.multiuser.title')} 
                description={t('features.multiuser.description')}
                delay={400}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">Real-time</div>
                <div className="text-xs text-muted-foreground">Updates</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">{t('free')}</div>
                <div className="text-xs text-muted-foreground">{t('toUse')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className={cn(
            "w-full max-w-md transition-all duration-700 delay-300",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {/* Glass Card */}
            <div className="relative">
              {/* Card glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-green-500/50 to-emerald-500/50 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    <Sparkles className="h-4 w-4" />
                    {t('welcome')}
                  </div>
                  <h3 className="text-2xl font-bold">{t('loginToContinue')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('useGoogleAccount')}
                  </p>
                </div>

                {/* Minecraft Server Preview */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Gamepad2 className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-100">{t('yourServer')}</span>
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Globe className="h-3 w-3" />
                        <code>meuservidor.exaroton.me</code>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{t('players')}</span>
                    <span className="text-green-400 font-mono">5/20</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  size="lg"
                  className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm transition-all hover:shadow-md"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('connecting')}
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {t('continueWithGoogle')}
                    </>
                  )}
                </Button>

                {/* Terms */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  {t('termsText')}{' '}
                  <a href="#" className="text-primary hover:underline">{t('termsOfUse')}</a>
                  {' '}{t('and')}{' '}
                  <a href="#" className="text-primary hover:underline">{t('privacyPolicy')}</a>
                </p>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('madeWith')} 💚 {t('forCommunity')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
