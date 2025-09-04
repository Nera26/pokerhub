'use client';

import { useEffect } from 'react';
import ErrorFallback from './components/ui/ErrorFallback';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <ErrorFallback onRetry={reset} />
      </body>
    </html>
  );
}
