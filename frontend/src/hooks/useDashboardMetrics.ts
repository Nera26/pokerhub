'use client';

import { DashboardMetricsSchema, type DashboardMetrics } from '@shared/types';
import { createGetHook } from './useApiQuery';

export const useDashboardMetrics = createGetHook<DashboardMetrics>(
  '/api/dashboard/metrics',
  DashboardMetricsSchema,
);
