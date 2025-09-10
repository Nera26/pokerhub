'use client';

import { createAdminQuery } from './useAdminQuery';

export const createAdminResource = <T>(
  key: string,
  fetcher: (...a: any[]) => Promise<T>,
) => createAdminQuery<T>(key, fetcher, key.replace('-', ' '));
