'use client';

import { useAuditQuery } from './useAuditQuery';
import type { ZodSchema } from 'zod';
import {
  SecurityAlertsResponseSchema,
  AuditLogsResponseSchema,
  AuditSummarySchema,
  type AlertItem,
  type AuditLogsResponse,
  type AuditSummary,
} from '@shared/types';

export const makeAuditHook =
  <T>(key: string, path: string, schema: ZodSchema<T>) =>
  () =>
    useAuditQuery<T>(key, path, schema);

export const useAuditAlerts = makeAuditHook<AlertItem[]>(
  'audit-alerts',
  '/api/admin/security-alerts',
  SecurityAlertsResponseSchema,
);

export const useAuditLogs = makeAuditHook<AuditLogsResponse>(
  'audit-logs',
  '/api/admin/audit-logs',
  AuditLogsResponseSchema,
);

export const useAuditSummary = makeAuditHook<AuditSummary>(
  'audit-summary',
  '/api/analytics/summary',
  AuditSummarySchema,
);
