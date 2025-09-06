'use client';

import { useQuery } from '@tanstack/react-query';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from '@/lib/api/client';
import {
  AuditLogsResponseSchema,
  type AuditLogsResponse,
} from '@shared/types';

async function fetchLogs({
  signal,
}: {
  signal?: AbortSignal;
}): Promise<AuditLogsResponse> {
  const baseUrl = getBaseUrl();
  try {
    return await handleResponse(
      fetch(`${baseUrl}/api/admin/audit-logs`, { credentials: 'include', signal }),
      AuditLogsResponseSchema,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch audit logs: ${message}` } as ApiError;
  }
}

export function useAuditLogs() {
  return useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs'],
    queryFn: ({ signal }) => fetchLogs({ signal }),
  });
}
