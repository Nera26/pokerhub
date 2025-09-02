'use client';

import { useQuery } from '@tanstack/react-query';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from '@/lib/api/client';
import {
  DashboardMetricsSchema,
  type DashboardMetrics,
} from '@shared/types';

async function fetchMetrics({
  signal,
}: {
  signal?: AbortSignal;
}): Promise<DashboardMetrics> {
  const baseUrl = getBaseUrl();
  try {
    return await handleResponse(
      fetch(`${baseUrl}/api/dashboard/metrics`, {
        credentials: 'include',
        signal,
      }),
      DashboardMetricsSchema,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch metrics: ${message}` } as ApiError;
  }
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: ({ signal }) => fetchMetrics({ signal }),
  });
}
