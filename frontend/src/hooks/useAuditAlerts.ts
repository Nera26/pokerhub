'use client';

import { SecurityAlertsResponseSchema, type AlertItem } from '@shared/types';
import useAuditQuery from './useAuditQuery';

export function useAuditAlerts() {
  return useAuditQuery<AlertItem[]>(
    '/api/admin/security-alerts',
    SecurityAlertsResponseSchema,
    'audit-alerts',
  );
}
