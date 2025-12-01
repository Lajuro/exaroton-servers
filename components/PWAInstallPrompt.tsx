"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Zap, Sparkles, WifiOff, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [_isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

   
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has permanently dismissed the prompt
    const permanentlyDismissed = localStorage.getItem("pwa-install-permanently-dismissed");
    if (permanentlyDismissed === "true") {
      setIsDismissed(true);
      return;
    }

    // Check session dismissal (only show once per session)
    const sessionDismissed = sessionStorage.getItem("pwa-install-session-dismissed");
    if (sessionDismissed === "true") {
      setIsDismissed(true);
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show banner after user has interacted with the page
      if (!sessionDismissed) {
        setTimeout(() => {
          setShowBanner(true);
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 500);
        }, 3000);
      }
    };

    // Handle appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
    };

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 5000);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setIsDismissed(true);
    // Only dismiss for this session - user can still see the minimal indicator
    sessionStorage.setItem("pwa-install-session-dismissed", "true");
  }, []);

  const handlePermanentDismiss = useCallback(() => {
    setShowBanner(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-permanently-dismissed", "true");
  }, []);

  const handleShowBanner = useCallback(() => {
    setShowBanner(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  }, []);

  // Offline indicator toast
  if (showOfflineToast) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-yellow-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
        <WifiOff className="h-5 w-5" />
        <span className="font-medium">{t("offline.title")}</span>
        <span className="text-sm opacity-90">• {t("offline.description")}</span>
      </div>
    );
  }

  // Don't render anything if installed or no prompt available
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  // Show minimal floating pill when banner is dismissed but PWA is available
  if (isDismissed && !showBanner) {
    return (
      <button
        onClick={handleShowBanner}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 text-green-600 dark:text-green-400 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/10 backdrop-blur-sm group"
        aria-label={t("install.button")}
      >
        <Smartphone className="h-4 w-4 group-hover:animate-pulse" />
        <span className="hidden sm:inline">{t("install.getApp")}</span>
        <Download className="h-3.5 w-3.5 opacity-60" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-500",
        isAnimating && "animate-in slide-in-from-bottom-full"
      )}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300",
            "bg-gradient-to-br from-background via-background to-green-500/5",
            "border-green-500/20 dark:border-green-500/30",
            "backdrop-blur-xl"
          )}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
          
          {/* Animated glow effect */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />

          <div className="relative p-4">
            {/* Header - Always visible */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* App icon with gradient background */}
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {t("install.title")}
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      {t("install.free")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {t("install.tagline")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Install button */}
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("install.install")}</span>
                </Button>

                {/* Expand/collapse button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label={isExpanded ? t("install.collapse") : t("install.expand")}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label={t("install.dismiss")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded content */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
                  {/* Feature 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t("install.quickAccess")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("install.quickAccessDesc")}
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t("install.nativeExperience")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("install.nativeExperienceDesc")}
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-teal-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t("install.offlineFeatures")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("install.offlineFeaturesDesc")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer with permanent dismiss option */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {t("install.uninstallNote")}
                  </p>
                  <button
                    onClick={handlePermanentDismiss}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                  >
                    {t("install.dontShowAgain")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Online status indicator for navbar
export function OnlineStatus() {
  const t = useTranslations("common");
  const [isOnline, setIsOnline] = useState(true);

   
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1 text-yellow-500 text-sm">
      <WifiOff className="h-4 w-4" />
      <span className="hidden sm:inline">{t("offline")}</span>
    </div>
  );
}
