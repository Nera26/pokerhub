import { z } from 'zod';
import { DashboardMetricsSchema as SharedDashboardMetricsSchema } from '@shared/types';

export const DashboardMetricsSchema = SharedDashboardMetricsSchema;
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
