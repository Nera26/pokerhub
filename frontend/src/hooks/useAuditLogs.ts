'use client';

import {
  AuditLogsResponseSchema,
  type AuditLogsResponse,
  type AuditLogsQuery,
} from '@shared/types';
import { apiClient } from '@/lib/api/client';
import { createQueryHook } from './useApiQuery';

export const useAuditLogs = createQueryHook<AuditLogsResponse, AuditLogsQuery>(
  'audit-logs',
  async (_client, params, { signal }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    const query = qs.toString();
    const path = query
      ? `/api/admin/audit-logs?${query}`
      : '/api/admin/audit-logs';
    return apiClient(path, AuditLogsResponseSchema, { signal });
  },
  'audit logs',
  { keepPreviousData: true },
);

export type { AuditLogsQuery } from '@shared/types';
