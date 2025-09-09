'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFeatureFlags } from '@/lib/api/feature-flags';
import type { FeatureFlagsResponse } from '@shared/types';

export function useFeatureFlags() {
  return useQuery<FeatureFlagsResponse>({
    queryKey: ['feature-flags'],
    queryFn: ({ signal }) => fetchFeatureFlags({ signal }),
  });
}
