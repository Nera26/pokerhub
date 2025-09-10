'use client';

import { createQueryHook } from './useApiQuery';

export const createAdminResource = <T>(
  key: string,
  fetcher: (...a: any[]) => Promise<T>,
) =>
  createQueryHook<T>(
    key,
    (_client, opts) => fetcher({ signal: opts.signal }),
    key.replace(/-/g, ' '),
  );
