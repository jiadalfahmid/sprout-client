import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global reference so prompt event captured before component mounts is never lost
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser mini-infobar
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((listener) => listener());
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => globalDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (installed as PWA)
    const checkIsInstalled = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      return Boolean(isStandaloneMedia || isIOSStandalone || isAndroidApp);
    };

    setIsInstalled(checkIsInstalled());

    // Check if in iframe (e.g. AI Studio development preview)
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    // Platform and Browser detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    const isChromeBrowser = /chrome|chromium|crios/i.test(ua) && !/edg/i.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsChrome(isChromeBrowser);

    const updateState = () => {
      setDeferredPrompt(globalDeferredPrompt);
      setIsInstalled(checkIsInstalled());
    };

    listeners.add(updateState);

    const displayModeHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    const mql = window.matchMedia('(display-mode: standalone)');
    if (mql.addEventListener) {
      mql.addEventListener('change', displayModeHandler);
    }

    return () => {
      listeners.delete(updateState);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', displayModeHandler);
      }
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<{
    outcome: 'accepted' | 'dismissed' | 'unsupported' | 'opened_guide';
    platform?: string;
  }> => {
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
        }
        return { outcome: choice.outcome, platform: choice.platform };
      } catch (err) {
        console.warn('PWA install prompt error:', err);
        return { outcome: 'unsupported' };
      }
    }

    return { outcome: 'opened_guide' };
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isChrome,
    isInIframe,
    triggerInstall,
  };
}
