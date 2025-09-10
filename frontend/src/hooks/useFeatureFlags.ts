'use client';

import { fetchFeatureFlags } from '@/lib/api/feature-flags';
import type { FeatureFlagsResponse } from '@shared/types';
import { createQueryHook } from './useApiQuery';

export const useFeatureFlags = createQueryHook<FeatureFlagsResponse>(
  'feature-flags',
  (_client, _params, opts) => fetchFeatureFlags({ signal: opts.signal }),
  'feature flags',
);
