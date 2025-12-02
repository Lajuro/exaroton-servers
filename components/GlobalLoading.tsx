'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect, ReactNode } from 'react';

// ============================================================================
// CONSTANTES
// ============================================================================

const FADE_DURATION = 200; // ms - duração do fade in/out
const MIN_DISPLAY_DURATION = 400; // ms - tempo mínimo que o skeleton fica visível

// Blocos de Minecraft animados
const MINECRAFT_BLOCKS = [
  { emoji: '🟫', name: 'dirt', delay: 0 },
  { emoji: '🟩', name: 'grass', delay: 0.1 },
  { emoji: '⬜', name: 'stone', delay: 0.2 },
  { emoji: '🟨', name: 'gold', delay: 0.3 },
  { emoji: '💎', name: 'diamond', delay: 0.4 },
];

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para controlar fade in/out com duração mínima
 * Garante que o loading apareça por pelo menos minDuration ms
 */
export function useLoadingTransition(minDuration: number = MIN_DISPLAY_DURATION) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [mountTime] = useState(() => Date.now());

  // Fade in ao montar
  useEffect(() => {
    // Pequeno delay para garantir que o DOM está pronto
    const fadeInTimer = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(fadeInTimer);
  }, []);

  // Função para iniciar o fade out (chamada quando o loading termina)
  const startFadeOut = () => {
    const elapsed = Date.now() - mountTime;
    const remaining = Math.max(0, minDuration - elapsed);

    // Esperar o tempo restante antes de fazer fade out
    setTimeout(() => {
      setIsVisible(false);
      // Esperar a animação de fade out terminar antes de desmontar
      setTimeout(() => {
        setShouldRender(false);
      }, FADE_DURATION);
    }, remaining);
  };

  return { isVisible, shouldRender, startFadeOut };
}

/**
 * Hook para controlar loading com estado externo
 */
export function useLoadingWithMinDuration(isLoading: boolean, minDuration: number = MIN_DISPLAY_DURATION) {
  const [showLoading, setShowLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !showLoading) {
      // Começar a mostrar o loading
      setShowLoading(true);
      setStartTime(Date.now());
      // Pequeno delay para permitir a animação de fade in
      requestAnimationFrame(() => setIsVisible(true));
    } else if (!isLoading && showLoading && startTime) {
      // Calcular quanto tempo já passou
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);

      // Esperar o tempo restante antes de fazer fade out
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Esperar a animação de fade out terminar antes de esconder
        setTimeout(() => {
          setShowLoading(false);
          setStartTime(null);
        }, FADE_DURATION);
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isLoading, showLoading, startTime, minDuration]);

  return { showLoading, isVisible };
}

// ============================================================================
// PAGE TRANSITION - Para transição entre loading e conteúdo
// ============================================================================

interface PageTransitionProps {
  isLoading: boolean;
  loadingComponent: ReactNode;
  children: ReactNode;
  minDuration?: number;
}

/**
 * Componente que gerencia a transição suave entre loading e conteúdo
 * Renderiza ambos e controla a visibilidade com fade suave
 */
export function PageTransition({ 
  isLoading, 
  loadingComponent, 
  children, 
  minDuration = MIN_DISPLAY_DURATION 
}: PageTransitionProps) {
  const { showLoading, isVisible: loadingVisible } = useLoadingWithMinDuration(isLoading, minDuration);
  const [contentMounted, setContentMounted] = useState(!isLoading);
  const [contentVisible, setContentVisible] = useState(!isLoading);

  useEffect(() => {
    if (!showLoading) {
      // Montar o conteúdo primeiro (invisível)
      setContentMounted(true);
      // Depois de um frame, começar o fade in do conteúdo
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 50); // Pequeno delay para garantir que o DOM está pronto
      return () => clearTimeout(timer);
    } else {
      // Quando volta a carregar, esconder o conteúdo com fade out
      setContentVisible(false);
      // Depois do fade out, desmontar
      const timer = setTimeout(() => {
        setContentMounted(false);
      }, FADE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [showLoading]);

  return (
    <>
      {/* Loading Skeleton */}
      {showLoading && (
        <div
          className={cn(
            "fixed inset-0 z-50 transition-opacity ease-out",
            loadingVisible ? "opacity-100" : "opacity-0"
          )}
          style={{ transitionDuration: `${FADE_DURATION}ms` }}
        >
          {loadingComponent}
        </div>
      )}
      
      {/* Content - sempre renderiza quando montado, controla opacidade */}
      {contentMounted && (
        <div
          className={cn(
            "transition-opacity ease-out",
            contentVisible ? "opacity-100" : "opacity-0"
          )}
          style={{ transitionDuration: `${FADE_DURATION}ms` }}
        >
          {children}
        </div>
      )}
    </>
  );
}

// ============================================================================
// WRAPPER COMPONENT - Para qualquer conteúdo de loading
// ============================================================================

interface LoadingWrapperProps {
  children: ReactNode;
  className?: string;
  minDuration?: number;
}

/**
 * Wrapper que adiciona fade in/out a qualquer conteúdo de loading
 * Garante duração mínima e transições suaves
 */
export function LoadingWrapper({ children, className, minDuration = MIN_DISPLAY_DURATION }: LoadingWrapperProps) {
  const { isVisible, shouldRender } = useLoadingTransition(minDuration);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "transition-opacity ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDuration: `${FADE_DURATION}ms` }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// TIPOS
// ============================================================================

interface GlobalLoadingProps {
  message?: string;
  fullScreen?: boolean;
  minDuration?: number;
}

interface GlobalLoadingWithFadeProps extends GlobalLoadingProps {
  isLoading: boolean;
}

// ============================================================================
// COMPONENTES DE LOADING
// ============================================================================

/**
 * Conteúdo visual do loading (sem lógica de transição)
 */
function LoadingContent({ message, fullScreen = true }: { message?: string; fullScreen?: boolean }) {
  const t = useTranslations('common');
  const displayMessage = message ?? t('loading');

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background/95 backdrop-blur-sm",
        fullScreen && "fixed inset-0 z-50"
      )}
    >
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8881_1px,transparent_1px),linear-gradient(to_bottom,#8881_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      </div>

      {/* Loading content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo com animação */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-primary/30 blur-2xl animate-glow scale-125" />
          
          <div className="absolute inset-[-12px] rounded-3xl">
            <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="loading-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="rgb(16 185 129)" stopOpacity="0" />
                  <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="url(#loading-gradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-xl shadow-2xl">
            <Image
              src="/logo_msm.svg"
              alt="MineServerManager"
              width={56}
              height={56}
              className="h-14 w-14 invert dark:invert-0 transition-transform group-hover:scale-110"
              priority
            />
            
            <div className="absolute -top-1 -right-1 w-4 h-4">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="relative block w-4 h-4 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* Texto e animação de blocos */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            MineServerManager
          </h2>
          
          <div className="flex items-center gap-1">
            {MINECRAFT_BLOCKS.map((block) => (
              <div
                key={block.name}
                className="text-lg animate-bounce-block"
                style={{ animationDelay: `${block.delay}s` }}
              >
                {block.emoji}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">{displayMessage}</span>
            <LoadingDots />
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-56 h-1.5 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-primary to-emerald-500 rounded-full animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * GlobalLoading com fade in automático ao montar
 * Este é o componente padrão - sempre faz fade in ao aparecer
 */
export function GlobalLoading({ message, fullScreen = true, minDuration = MIN_DISPLAY_DURATION }: GlobalLoadingProps) {
  const { isVisible, shouldRender } = useLoadingTransition(minDuration);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "transition-opacity ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        fullScreen && "fixed inset-0 z-50"
      )}
      style={{ transitionDuration: `${FADE_DURATION}ms` }}
    >
      <LoadingContent message={message} fullScreen={fullScreen} />
    </div>
  );
}

/**
 * GlobalLoading controlado por estado externo
 * Usa isLoading para controlar quando aparecer/desaparecer
 */
export function GlobalLoadingWithFade({ 
  isLoading, 
  minDuration = MIN_DISPLAY_DURATION, 
  message,
  fullScreen = true
}: GlobalLoadingWithFadeProps) {
  const { showLoading, isVisible } = useLoadingWithMinDuration(isLoading, minDuration);

  if (!showLoading) return null;

  return (
    <div
      className={cn(
        "transition-opacity ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        fullScreen && "fixed inset-0 z-50"
      )}
      style={{ transitionDuration: `${FADE_DURATION}ms` }}
    >
      <LoadingContent message={message} fullScreen={fullScreen} />
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function LoadingDots() {
  return (
    <span className="flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

/**
 * Mini loading para uso inline
 */
export function MiniLoading({ className, text }: { className?: string; text?: string }) {
  const t = useTranslations('common');
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-4 w-4">
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
      </div>
      <span className="text-sm text-muted-foreground">{text ?? t('loading')}</span>
    </div>
  );
}

/**
 * Spinner simples para botões
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <svg 
      className={cn("animate-spin h-4 w-4", className)} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Loading para seções da página
 */
export function SectionLoading({ className, message }: { className?: string; message?: string }) {
  const t = useTranslations('common');
  
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 gap-4", className)}>
      <div className="flex gap-2">
        {['🟫', '🟩', '⬜'].map((block, i) => (
          <div
            key={i}
            className="text-2xl animate-bounce-block"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {block}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{message ?? t('loading')}</p>
    </div>
  );
}
