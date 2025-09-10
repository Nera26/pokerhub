'use client';

import { createQueryHook } from './useApiQuery';
import {
  SecurityAlertsResponseSchema,
  AdminEventsResponseSchema,
  type AlertItem,
  type AdminEvent,
} from '@shared/types';
import type { apiClient } from '@/lib/api/client';

export function createAdminFeedHook<T>(
  key: string,
  fetcher: (
    client: typeof apiClient,
    opts: { signal?: AbortSignal },
  ) => Promise<T>,
  label: string,
) {
  const hook = createQueryHook<T>(key, fetcher, label);
  (hook as any).queryKey = [key];
  return hook as typeof hook & { queryKey: [string] };
}

export const useAdminEvents = createAdminFeedHook<AdminEvent[]>(
  'admin-events',
  (client, opts) =>
    client('/api/admin/events', AdminEventsResponseSchema, opts),
  'admin events',
);

export const useAuditAlerts = createAdminFeedHook<AlertItem[]>(
  'audit-alerts',
  (client, opts) =>
    client('/api/admin/security-alerts', SecurityAlertsResponseSchema, opts),
  'audit alerts',
);
