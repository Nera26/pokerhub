'use client';

import { AdminEventsResponseSchema, type AdminEvent } from '@shared/types';
import { createGetHook } from './useApiQuery';

export const useAdminEvents = createGetHook<AdminEvent[]>(
  '/api/admin/events',
  AdminEventsResponseSchema,
);
