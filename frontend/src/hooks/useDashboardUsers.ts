'use client';

import { fetchDashboardUsers } from '@/lib/api/admin';
import type { DashboardUser } from '@shared/types';
import { createQueryHook } from './createQueryHook';

const useDashboardUsersQuery = createQueryHook<DashboardUser[], number>(
  'dashboard-users',
  (_client, limit, opts) => fetchDashboardUsers({ limit, signal: opts.signal }),
  'dashboard users',
);

export function useDashboardUsers(
  limit = 5,
  options?: Parameters<typeof useDashboardUsersQuery>[1],
) {
  return useDashboardUsersQuery(limit, options);
}
