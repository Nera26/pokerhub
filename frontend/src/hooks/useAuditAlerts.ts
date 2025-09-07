'use client';

import { createQueryHook } from './useApiQuery';
import { SecurityAlertsResponseSchema, type AlertItem } from '@shared/types';

export const useAuditAlerts = createQueryHook<AlertItem[]>(
  'audit-alerts',
  (client, opts) => client('/api/admin/security-alerts', SecurityAlertsResponseSchema, opts),
  'audit alerts',
);
