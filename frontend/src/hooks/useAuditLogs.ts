'use client';

import { useAuditQuery } from './useAuditQuery';
import { AuditLogsResponseSchema, type AuditLogsResponse } from '@shared/types';

export function useAuditLogs() {
  return useAuditQuery<AuditLogsResponse>(
    'audit-logs',
    '/api/admin/audit-logs',
    AuditLogsResponseSchema,
  );
}
