'use client';

import { createResourceHook } from './createResourceHook';
import { SecurityAlertsResponseSchema, type AlertItem } from '@shared/types';

export const useAuditAlerts = createResourceHook<AlertItem[]>(
  'audit-alerts',
  (client, opts) =>
    client('/api/admin/security-alerts', SecurityAlertsResponseSchema, opts),
  'audit alerts',
);
