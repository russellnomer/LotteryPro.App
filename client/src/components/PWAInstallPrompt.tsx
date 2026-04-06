import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_KEY = 'lotterypro_visits';
const DISMISS_KEY = 'lotterypro_pwa_dismiss';
const DISMISS_DAYS = 7;
const MIN_VISITS = 3;

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_KEY, String(visits));

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(parseInt(dismissedAt, 10));
      const now = new Date();
      const diffDays = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < DISMISS_DAYS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (visits >= MIN_VISITS) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <div className="mx-auto max-w-lg rounded-xl bg-indigo-600 p-4 shadow-2xl shadow-indigo-500/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Install LotteryPro for quick access to your picks and analysis
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 min-h-[44px]"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition hover:text-white min-h-[44px]"
              >
                Maybe Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-white/60 transition hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
