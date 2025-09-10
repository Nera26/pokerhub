'use client';

import { useTranslations } from 'next-intl';
import Button from '../components/ui/Button';
import useOffline from '@/hooks/useOffline';

export default function OfflinePage() {
  const t = useTranslations('offline');
  const sw = useTranslations('serviceWorker');
  const { retry } = useOffline();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-text-secondary">{t('body')}</p>
      <Button className="mt-6" onClick={retry}>
        {sw('reload')}
      </Button>
    </div>
  );
}
