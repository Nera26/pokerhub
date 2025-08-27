'use client';

import { useTranslations } from 'next-intl';
import Button from '../components/ui/Button';

export default function OfflinePage() {
  const t = useTranslations('serviceWorker');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="mt-4 text-text-secondary">
        Some features may be unavailable. Please check your connection and try again.
      </p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        {t('reload')}
      </Button>
    </div>
  );
}
