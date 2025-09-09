'use client';

import { createQueryHook } from './useApiQuery';
import { fetchFeatureFlags } from '@/lib/api/feature-flags';
import type { FeatureFlagsResponse } from '@shared/types';

export const useFeatureFlags = createQueryHook<FeatureFlagsResponse>(
  'feature-flags',
  (_client, opts) => fetchFeatureFlags(opts),
  'feature flags',
);
