'use client';

import { fetchAdminEvents } from '@/lib/api/admin';
import type { AdminEvent } from '@shared/types';
import { createAdminQuery } from './useAdminQuery';

export const useAdminEvents = createAdminQuery<AdminEvent[]>(
  'admin-events',
  fetchAdminEvents,
  'admin events',
);
