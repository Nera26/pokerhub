import { z } from 'zod';

export const RevenueTimeFilterSchema = z.enum(['today', 'week', 'month', 'all']);
export type RevenueTimeFilter = z.infer<typeof RevenueTimeFilterSchema>;
