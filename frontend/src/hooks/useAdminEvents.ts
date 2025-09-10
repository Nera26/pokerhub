'use client';

import { fetchAdminEvents } from '@/lib/api/admin';
import type { AdminEvent } from '@shared/types';
import { createResourceHook } from './createResourceHook';

export const useAdminEvents = createResourceHook<AdminEvent[]>(
  'admin-events',
  (_client, opts) => fetchAdminEvents({ signal: opts.signal }),
);
