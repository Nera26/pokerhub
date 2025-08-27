'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from '@/lib/api/client';

const MetricsSchema = z.object({
  online: z.number(),
  revenue: z.number(),
});
export type DashboardMetrics = z.infer<typeof MetricsSchema>;

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
      MetricsSchema,
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
