'use client';

import { createQueryHook } from './useApiQuery';
import { AuditLogsResponseSchema, type AuditLogsResponse } from '@shared/types';

export const useAuditLogs = createQueryHook<AuditLogsResponse>(
  'audit-logs',
  (client, opts) => client('/api/admin/audit-logs', AuditLogsResponseSchema, opts),
  'audit logs',
);
