'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Button from './components/ui/Button';
import { env } from '@/lib/env';
import useOffline from '@/hooks/useOffline';

export default function ServiceWorker() {
  const t = useTranslations('serviceWorker');
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const { online, retry } = useOffline();

  const handleRefresh = useCallback(() => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setWaitingWorker(null);
    retry();
    if (!navigator.onLine) {
      window.location.reload();
    }
  }, [retry, waitingWorker]);

  const handleDismiss = () => setIsUpdateAvailable(false);

  useEffect(() => {
    if (env.IS_E2E || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Expose waiting worker to trigger update prompt
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setIsUpdateAvailable(true);
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && registration.waiting) {
                setWaitingWorker(registration.waiting);
                setIsUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) =>
          console.error('Service worker registration failed:', err),
        );
    };

    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
    };
  }, []);

  if (env.IS_E2E) return null;

  return (
    <>
      {!online && (
        <div className="fixed bottom-4 left-4 z-50 rounded-xl bg-card-bg p-4 text-text-primary shadow-lg border border-border-dark">
          <p>{t('offlineNotice')}</p>
        </div>
      )}
      {isUpdateAvailable && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-card-bg p-4 text-text-primary shadow-lg border border-border-dark">
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="flex flex-col gap-2"
          >
            <p>{t('updatePrompt')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={handleDismiss}>
                {t('dismiss')}
              </Button>
              <Button size="sm" onClick={handleRefresh}>
                {t('reload')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
