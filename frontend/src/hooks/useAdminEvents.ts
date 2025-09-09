'use client';

import { createQueryHook } from './useApiQuery';
import { fetchAdminEvents } from '@/lib/api/admin';
import type { AdminEvent } from '@shared/types';

const useAdminEvents = createQueryHook<AdminEvent[]>(
  'admin-events',
  (_client, opts) => fetchAdminEvents({ signal: opts.signal }),
  'admin events',
);

export default useAdminEvents;
