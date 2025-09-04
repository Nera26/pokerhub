'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import ErrorFallback from './ErrorFallback';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return <ErrorFallback onRetry={reset} />;
}
