'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchActivity } from '@/lib/api/analytics';
import type { ActivityResponse } from '@shared/types';
import type { ApiError } from '@/lib/api/client';

export function useActivity() {
  return useQuery<ActivityResponse, ApiError>({
    queryKey: ['activity'],
    queryFn: ({ signal }) => fetchActivity({ signal }),
  });
}
