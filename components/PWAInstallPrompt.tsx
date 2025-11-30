"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, CheckCircle, Wifi, WifiOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Don't show prompt again for 7 days
      if (daysSinceDismissed < 7) {
        setHasShownPrompt(true);
      }
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if not dismissed recently
      if (!hasShownPrompt) {
        setTimeout(() => {
          setShowInstallDialog(true);
        }, 5000); // Show after 5 seconds
      }
    };

    // Handle appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallDialog(false);
    };

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      // Auto-hide after 5 seconds
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
  }, [hasShownPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowInstallDialog(false);
  };

  const handleDismiss = () => {
    setShowInstallDialog(false);
    setHasShownPrompt(true);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  };

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

  return (
    <>
      {/* Floating install button */}
      <Button
        onClick={() => setShowInstallDialog(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg hover:shadow-xl transition-all bg-background/80 backdrop-blur-sm border-green-500/50 text-green-600 hover:text-green-700 hover:border-green-500"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{t("install.button")}</span>
      </Button>

      {/* Install dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-500" />
              {t("install.title")}
            </DialogTitle>
            <DialogDescription>
              {t("install.description")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{t("install.quickAccess")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("install.quickAccessDesc")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{t("install.nativeExperience")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("install.nativeExperienceDesc")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Wifi className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{t("install.offlineFeatures")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("install.offlineFeaturesDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleInstall} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                {t("install.install")}
              </Button>
              <Button variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              {t("install.uninstallNote")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
