'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, type ApiError } from '@/lib/api/client';

export const RevenueStreamSchema = z.object({
  label: z.string(),
  pct: z.number(),
  value: z.number().optional(),
});
export type RevenueStream = z.infer<typeof RevenueStreamSchema>;

export const RevenueBreakdownSchema = z.array(RevenueStreamSchema);
export type RevenueBreakdown = z.infer<typeof RevenueBreakdownSchema>;

type TimeFilter = 'today' | 'week' | 'month' | 'all';

async function fetchRevenueBreakdown(
  range: TimeFilter,
  { signal }: { signal?: AbortSignal },
): Promise<RevenueBreakdown> {
  const baseUrl = getBaseUrl();
  try {
    return await handleResponse(
      fetch(`${baseUrl}/api/admin/revenue-breakdown?range=${range}`, {
        credentials: 'include',
        signal,
      }),
      RevenueBreakdownSchema,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw {
      message: `Failed to fetch revenue breakdown: ${message}`,
    } as ApiError;
  }
}

export function useRevenueBreakdown(range: TimeFilter) {
  return useQuery<RevenueBreakdown>({
    queryKey: ['revenue-breakdown', range],
    queryFn: ({ signal }) => fetchRevenueBreakdown(range, { signal }),
  });
}
