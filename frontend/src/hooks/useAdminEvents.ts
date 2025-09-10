'use client';

import { fetchAdminEvents } from '@/lib/api/admin';
import type { AdminEvent } from '@shared/types';
import { createQueryHook } from './useApiQuery';

export const useAdminEvents = createQueryHook<AdminEvent[]>(
  'admin-events',
  (_client, opts) => fetchAdminEvents({ signal: opts.signal }),
  'admin events',
);
