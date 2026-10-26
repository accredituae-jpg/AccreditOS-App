import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Detect Online / Offline Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect if already installed (standalone mode)
    const checkInstalled = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(!!isStandalone);
    };

    checkInstalled();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleIOS);

    // Intercept native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', checkInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          toast.success("AccreditOS ERP installed successfully!");
          return true;
        }
      } catch (err) {
        console.error('PWA Installation error:', err);
      }
    } else {
      // Trigger modal dialog with browser/device installation instructions
      window.dispatchEvent(new CustomEvent('open_pwa_install_dialog'));
      toast.info("Opened App Installation guide.");
    }
    return false;
  }, [deferredPrompt]);

  return {
    isOnline,
    isInstalled,
    canInstall: !!deferredPrompt,
    isIOS,
    showInstallButton: !isInstalled,
    triggerInstall,
  };
}
