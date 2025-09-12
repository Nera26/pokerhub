'use client';

import {
  FeatureFlagsResponseSchema,
  type FeatureFlagsResponse,
} from '@shared/types';
import { createGetHook } from './useApiQuery';

export const useFeatureFlags = createGetHook<FeatureFlagsResponse>(
  '/api/feature-flags',
  FeatureFlagsResponseSchema,
);
