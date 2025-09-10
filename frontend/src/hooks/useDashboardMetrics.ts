'use client';

import { createQueryHook } from './useApiQuery';
import { DashboardMetricsSchema, type DashboardMetrics } from '@shared/types';

export const useDashboardMetrics = createQueryHook<DashboardMetrics>(
  'dashboard-metrics',
  (client, opts) =>
    client('/api/dashboard/metrics', DashboardMetricsSchema, opts),
  'dashboard metrics',
);
