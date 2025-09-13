'use client';

import { createGetHook } from './useApiQuery';
import {
  SecurityAlertsResponseSchema,
  type AlertItem,
  AdminEventsResponseSchema,
  type AdminEvent,
} from '@shared/types';

export const useAuditAlerts = createGetHook<AlertItem[]>(
  '/api/admin/security-alerts',
  SecurityAlertsResponseSchema,
);

export const useAdminEvents = createGetHook<AdminEvent[]>(
  '/api/admin/events',
  AdminEventsResponseSchema,
);
