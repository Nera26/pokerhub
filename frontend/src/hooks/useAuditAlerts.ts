'use client';

import { useAuditQuery } from './useAuditQuery';
import { SecurityAlertsResponseSchema, type AlertItem } from '@shared/types';

export function useAuditAlerts() {
  return useAuditQuery<AlertItem[]>(
    'audit-alerts',
    '/api/admin/security-alerts',
    SecurityAlertsResponseSchema,
  );
}
