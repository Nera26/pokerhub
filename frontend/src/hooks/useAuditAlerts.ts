'use client';

import { useQuery } from '@tanstack/react-query';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from '@/lib/api/client';
import {
  SecurityAlertsResponseSchema,
  type AlertItem,
} from '@shared/types';

async function fetchAlerts({
  signal,
}: {
  signal?: AbortSignal;
}): Promise<AlertItem[]> {
  const baseUrl = getBaseUrl();
  try {
    return await handleResponse(
      fetch(`${baseUrl}/api/admin/security-alerts`, {
        credentials: 'include',
        signal,
      }),
      SecurityAlertsResponseSchema,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch security alerts: ${message}` } as ApiError;
  }
}

export function useAuditAlerts() {
  return useQuery<AlertItem[]>({
    queryKey: ['audit-alerts'],
    queryFn: ({ signal }) => fetchAlerts({ signal }),
  });
}
