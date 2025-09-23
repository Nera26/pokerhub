'use client';

import { createQueryHook } from './createQueryHook';
import {
  RevenueBreakdownSchema,
  type RevenueBreakdown,
  type RevenueTimeFilter,
} from '@shared/types';

export type { RevenueTimeFilter };

export function useRevenueBreakdown(range: RevenueTimeFilter) {
  return createQueryHook<RevenueBreakdown>(
    `revenue-breakdown-${range}`,
    (client, _params, opts) =>
      client(
        `/api/admin/revenue-breakdown?range=${range}`,
        RevenueBreakdownSchema,
        opts,
      ),
    'revenue breakdown',
  )();
}
