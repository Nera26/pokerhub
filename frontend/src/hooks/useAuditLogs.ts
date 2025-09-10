'use client';

import { createResourceHook } from './createResourceHook';
import { AuditLogsResponseSchema, type AuditLogsResponse } from '@shared/types';

export const useAuditLogs = createResourceHook<AuditLogsResponse>(
  'audit-logs',
  (client, opts) =>
    client('/api/admin/audit-logs', AuditLogsResponseSchema, opts),
  'audit logs',
);
