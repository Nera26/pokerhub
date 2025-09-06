'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminOverview } from '@/lib/api/analytics';
import type { AdminOverview } from '@shared/types';

export function useAdminOverview() {
  return useQuery<AdminOverview[]>({
    queryKey: ['admin-overview'],
    queryFn: ({ signal }) => fetchAdminOverview({ signal }),
  });
}
