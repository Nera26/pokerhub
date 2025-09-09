'use client';

import { createQueryHook } from './useApiQuery';
import type { ZodSchema } from 'zod';
import {
  SecurityAlertsResponseSchema,
  AuditLogsResponseSchema,
  AuditSummarySchema,
  type AlertItem,
  type AuditLogsResponse,
  type AuditSummary,
} from '@shared/types';

export const makeAuditHook = <T>(
  key: string,
  path: string,
  schema: ZodSchema<T>,
  keyLabel: string,
) =>
  createQueryHook<T>(
    key,
    (client, opts) => client(path, schema, opts),
    keyLabel,
  );

const useAuditAlerts = makeAuditHook<AlertItem[]>(
  'audit-alerts',
  '/api/admin/security-alerts',
  SecurityAlertsResponseSchema,
  'audit alerts',
);

const useAuditLogs = makeAuditHook<AuditLogsResponse>(
  'audit-logs',
  '/api/admin/audit-logs',
  AuditLogsResponseSchema,
  'audit logs',
);

const useAuditSummary = makeAuditHook<AuditSummary>(
  'audit-summary',
  '/api/analytics/summary',
  AuditSummarySchema,
  'audit summary',
);

export { useAuditAlerts, useAuditLogs, useAuditSummary };
