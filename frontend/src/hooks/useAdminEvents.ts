'use client';

import { createQueryHook } from './useApiQuery';
import { AdminEventsResponseSchema, type AdminEvent } from '@shared/types';

export const useAdminEvents = createQueryHook<AdminEvent[]>(
  'admin-events',
  (client, opts) =>
    client('/api/admin/events', AdminEventsResponseSchema, opts),
  'admin events',
);
