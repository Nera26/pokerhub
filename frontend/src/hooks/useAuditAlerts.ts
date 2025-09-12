'use client';

import { SecurityAlertsResponseSchema, type AlertItem } from '@shared/types';
import { createGetHook } from './useApiQuery';

export const useAuditAlerts = createGetHook<AlertItem[]>(
  '/api/admin/security-alerts',
  SecurityAlertsResponseSchema,
);
