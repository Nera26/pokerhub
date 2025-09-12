'use client';

import { createQueryHook } from './createQueryHook';
import { RevenueBreakdownSchema, type RevenueBreakdown } from '@shared/types';

export type TimeFilter = 'today' | 'week' | 'month' | 'all';

export function useRevenueBreakdown(range: TimeFilter) {
  return createQueryHook<RevenueBreakdown>(
    `revenue-breakdown-${range}`,
    (client, opts) =>
      client(
        `/api/admin/revenue-breakdown?range=${range}`,
        RevenueBreakdownSchema,
        opts,
      ),
    'revenue breakdown',
  )();
}
