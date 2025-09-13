'use client';

import type { ZodSchema } from 'zod';
import { createGetHook } from './useApiQuery';
import {
  SecurityAlertsResponseSchema,
  type AlertItem,
  AdminEventsResponseSchema,
  type AdminEvent,
} from '@shared/types';

export function createAdminGetHook<T>(path: string, schema: ZodSchema<T>) {
  return createGetHook<T>(path, schema);
}

export const useAuditAlerts = createAdminGetHook<AlertItem[]>(
  '/api/admin/security-alerts',
  SecurityAlertsResponseSchema,
);

export const useAdminEvents = createAdminGetHook<AdminEvent[]>(
  '/api/admin/events',
  AdminEventsResponseSchema,
);
