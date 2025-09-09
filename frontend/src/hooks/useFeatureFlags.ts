'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { FeatureFlagsResponseSchema } from '@shared/types';

export interface FeatureFlags {
  promotions: boolean;
  leaderboard: boolean;
}

export function useFeatureFlags() {
  const { data, error, isLoading } = useQuery<FeatureFlags>({
    queryKey: ['feature-flags'],
    queryFn: async ({ signal }) => {
      const flags = await apiClient(
        '/api/feature-flags',
        FeatureFlagsResponseSchema,
        { signal },
      );
      return {
        promotions: flags.promotions ?? false,
        leaderboard: flags.leaderboard ?? false,
      };
    },
  });

  return { data, error, isLoading };
}
