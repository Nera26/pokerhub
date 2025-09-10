'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AuditLogsResponseSchema,
  type AuditLogsResponse,
  type AuditLogsQuery,
} from '@shared/types';
import { apiClient, type ApiError } from '@/lib/api/client';

export function useAuditLogs(params: AuditLogsQuery) {
  return useQuery<AuditLogsResponse, ApiError>({
    queryKey: ['audit-logs', params],
    queryFn: async ({ signal }) => {
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
    keepPreviousData: true,
  });
}

export type { AuditLogsQuery } from '@shared/types';
