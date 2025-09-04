'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Button from './components/ui/Button';
import { IS_E2E } from '@/lib/env';

const PRECACHE_URLS = ['/', '/offline', '/favicon.ico'];

export default function ServiceWorker() {
  const t = useTranslations('serviceWorker');
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const handleRefresh = useCallback(() => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setWaitingWorker(null);
    window.location.reload();
  }, [waitingWorker]);

  const handleDismiss = () => setIsUpdateAvailable(false);

  useEffect(() => {
    if (IS_E2E || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          // Pre-cache critical assets for offline usage
          try {
            const cache = await caches.open('offline-cache');
            await cache.addAll(PRECACHE_URLS);
          } catch (err) {
            console.error('Failed to pre-cache assets', err);
          }

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
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('load', onLoad);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (IS_E2E) return null;

  return (
    <>
      {isOffline && (
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
