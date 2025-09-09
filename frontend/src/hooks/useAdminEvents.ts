'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminEvents } from '@/lib/api/admin';
import type { AdminEvent } from '@shared/types';

export function useAdminEvents() {
  return useQuery<AdminEvent[]>({
    queryKey: ['admin-events'],
    queryFn: ({ signal }) => fetchAdminEvents({ signal }),
  });
}
