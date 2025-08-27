'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-xl font-semibold">Something went wrong</h2>
      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
