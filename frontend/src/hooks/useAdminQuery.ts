'use client';

import { createQueryHook } from './useApiQuery';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';

export function createAdminQuery<T>(
  key: string,
  fetcher: (opts?: { signal?: AbortSignal }) => Promise<T>,
  label: string,
  options?: Omit<
    UseQueryOptions<T, ApiError, T, [string]>,
    'queryKey' | 'queryFn'
  >,
) {
  return createQueryHook<T>(
    key,
    (_client, opts) => fetcher({ signal: opts.signal }),
    label,
    options,
  );
}
