'use client';

import { DashboardMetricsSchema } from '@shared/types';
import { createSimpleGetHook } from './useSimpleGet';

export const useDashboardMetrics = createSimpleGetHook(
  '/api/dashboard/metrics',
  DashboardMetricsSchema,
);
