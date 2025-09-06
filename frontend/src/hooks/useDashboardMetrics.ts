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

interface MetricsWithDatasets extends DashboardMetrics {
  activity: number[];
  errors: number[];
}

export function useDashboardMetrics() {
  return useQuery<MetricsWithDatasets>({
    queryKey: ['dashboard-metrics'],
    queryFn: ({ signal }) => fetchMetrics({ signal }),
    select: (data) => ({
      online: data.online,
      revenue: data.revenue,
      activity: data.activity ?? [],
      errors: data.errors ?? [],
    }),
  });
}
