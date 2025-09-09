'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDashboardUsers } from '@/lib/api/admin';
import type { DashboardUser } from '@shared/types';

export function useDashboardUsers(limit = 5) {
  return useQuery<DashboardUser[]>({
    queryKey: ['dashboard-users', limit],
    queryFn: ({ signal }) => fetchDashboardUsers({ limit, signal }),
  });
}
