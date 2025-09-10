'use client';

import { fetchAdminEvents } from '@/lib/api/admin';
import type { AdminEvent } from '@shared/types';
import { createAdminResource } from './useAdminResource';

export const useAdminEvents = createAdminResource<AdminEvent[]>(
  'admin-events',
  fetchAdminEvents,
);
