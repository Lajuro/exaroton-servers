'use client';

import { useTranslations } from 'next-intl';
import { useImpersonation } from '@/lib/impersonation-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  UserCheck, 
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function ImpersonationBanner() {
  const t = useTranslations('impersonation');
  const { user: realUser } = useAuth();
  const { impersonatedUser, isImpersonating, stopImpersonation } = useImpersonation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animar quando iniciar impersonation
  useEffect(() => {
    if (isImpersonating) {
      setIsAnimating(true);
      setIsMinimized(false);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isImpersonating]);

  // Só mostrar para admins que estão impersonando
  if (!isImpersonating || !realUser?.isAdmin || !impersonatedUser) {
    return null;
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[100]">
        <Button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl",
            "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500",
            "hover:from-amber-600 hover:via-orange-600 hover:to-red-600",
            "border-2 border-white/20",
            "animate-pulse"
          )}
        >
          <Eye className="h-6 w-6 text-white" />
        </Button>
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white"></span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Overlay sutil em toda a tela */}
      <div 
        className="fixed inset-0 pointer-events-none z-[90]"
        style={{
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.03) 0%, transparent 100px)',
          boxShadow: 'inset 0 0 100px rgba(245, 158, 11, 0.05)',
        }}
      />
      
      {/* Borda animada ao redor da tela */}
      <div 
        className={cn(
          "fixed inset-0 pointer-events-none z-[95]",
          "border-4 border-amber-500/30",
          isAnimating && "animate-pulse"
        )}
        style={{
          boxShadow: 'inset 0 0 30px rgba(245, 158, 11, 0.1)',
        }}
      />

      {/* Banner principal */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[100]",
          "transition-all duration-500 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-0"
        )}
      >
        {/* Linha decorativa superior */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 animate-gradient-x" />
        
        {/* Conteúdo do banner */}
        <div 
          className={cn(
            "bg-gradient-to-r from-amber-950/95 via-orange-950/95 to-amber-950/95",
            "backdrop-blur-xl border-t border-amber-500/20",
            "px-4 py-3"
          )}
        >
          <div className="container mx-auto flex items-center justify-between gap-4">
            {/* Lado esquerdo - Ícone e info */}
            <div className="flex items-center gap-4">
              {/* Ícone de alerta animado */}
              <div className="relative">
                <div className={cn(
                  "p-3 rounded-xl",
                  "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
                  "border border-amber-500/30",
                  isAnimating && "animate-bounce"
                )}>
                  <ShieldAlert className="h-6 w-6 text-amber-400" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
              </div>

              {/* Texto de aviso */}
              <div className="hidden sm:block">
                <p className="text-amber-200 font-semibold text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t('viewingAs')}
                </p>
                <p className="text-amber-400/70 text-xs">
                  {t('actionsAsAdmin')}
                </p>
              </div>
            </div>

            {/* Centro - Usuário impersonado */}
            <div className="flex items-center gap-3 bg-black/30 rounded-full py-2 px-4 border border-amber-500/20">
              <Avatar className="h-10 w-10 ring-2 ring-amber-500 ring-offset-2 ring-offset-amber-950">
                <AvatarImage src={impersonatedUser.photoURL || undefined} />
                <AvatarFallback className="bg-amber-500 text-amber-950 font-bold">
                  {getUserInitials(impersonatedUser.displayName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-white font-semibold text-sm flex items-center gap-2">
                  {impersonatedUser.displayName}
                  {impersonatedUser.isAdmin && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-400">
                      Admin
                    </Badge>
                  )}
                </p>
                <p className="text-amber-300/70 text-xs">{impersonatedUser.email}</p>
              </div>
            </div>

            {/* Lado direito - Ações */}
            <div className="flex items-center gap-2">
              {/* Badge de servidores */}
              <Badge 
                variant="outline" 
                className="hidden md:flex gap-1 border-amber-500/30 text-amber-300 bg-amber-500/10"
              >
                <UserCheck className="h-3 w-3" />
                {t('serversAccess', { count: impersonatedUser.serverAccess?.length || 0 })}
              </Badge>

              {/* Botão minimizar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              >
                <EyeOff className="h-4 w-4" />
              </Button>

              {/* Botão sair */}
              <Button
                onClick={stopImpersonation}
                className={cn(
                  "gap-2",
                  "bg-gradient-to-r from-amber-500 to-orange-500",
                  "hover:from-amber-600 hover:to-orange-600",
                  "text-amber-950 font-semibold",
                  "shadow-lg shadow-amber-500/25"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('exitView')}</span>
                <span className="sm:hidden">{t('exit')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Espaçador para não cobrir conteúdo */}
      <div className="h-20" />
    </>
  );
}

// Componente para o botão de impersonation no painel admin
interface ImpersonateButtonProps {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    isAdmin: boolean;
    serverAccess: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  disabled?: boolean;
}

export function ImpersonateButton({ user, disabled }: ImpersonateButtonProps) {
  const t = useTranslations('impersonation');
  const { startImpersonation, isImpersonating } = useImpersonation();
  const { user: currentUser } = useAuth();

  // Não mostrar para si mesmo
  if (currentUser?.uid === user.uid) {
    return null;
  }

  const handleClick = () => {
    startImpersonation({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAdmin: user.isAdmin,
      serverAccess: user.serverAccess || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isImpersonating}
      className={cn(
        "gap-2 transition-all",
        "border-amber-500/30 text-amber-600 dark:text-amber-400",
        "hover:bg-amber-500/10 hover:border-amber-500/50",
        "disabled:opacity-50"
      )}
    >
      <Eye className="h-4 w-4" />
      <span className="hidden lg:inline">{t('viewAs')}</span>
    </Button>
  );
}
