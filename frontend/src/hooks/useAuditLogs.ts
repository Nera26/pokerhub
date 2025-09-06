'use client';

import { AuditLogsResponseSchema, type AuditLogsResponse } from '@shared/types';
import useAuditQuery from './useAuditQuery';

export function useAuditLogs() {
  return useAuditQuery<AuditLogsResponse>(
    '/api/admin/audit-logs',
    AuditLogsResponseSchema,
    'audit-logs',
  );
}
