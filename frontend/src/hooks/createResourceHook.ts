'use client';

import { createQueryHook } from './useApiQuery';
import type { apiClient } from '@/lib/api/client';

export const createResourceHook = <T>(
  key: string,
  fetcher: (
    client: typeof apiClient,
    opts: { signal?: AbortSignal },
  ) => Promise<T>,
  label: string = key.replace(/-/g, ' '),
) => createQueryHook<T>(key, fetcher, label);
