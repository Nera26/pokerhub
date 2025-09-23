'use client';

import { fetchPerformanceThresholds } from '@/lib/api/config';
import { createQueryHook } from './createQueryHook';
import type { PerformanceThresholdsResponse } from '@shared/types';

export const usePerformanceThresholds =
  createQueryHook<PerformanceThresholdsResponse>(
    'performance-thresholds',
    (_client, opts) => fetchPerformanceThresholds(opts),
    'performance thresholds',
  );
