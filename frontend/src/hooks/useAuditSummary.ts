'use client';

import { useQuery } from '@tanstack/react-query';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from '@/lib/api/client';
import { AuditSummarySchema, type AuditSummary } from '@shared/types';

async function fetchSummary({ signal }: { signal?: AbortSignal }): Promise<AuditSummary> {
  const baseUrl = getBaseUrl();
  try {
    return await handleResponse(
      fetch(`${baseUrl}/api/analytics/summary`, { credentials: 'include', signal }),
      AuditSummarySchema,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch audit summary: ${message}` } as ApiError;
  }
}

export function useAuditSummary() {
  return useQuery<AuditSummary>({
    queryKey: ['audit-summary'],
    queryFn: ({ signal }) => fetchSummary({ signal }),
  });
}

