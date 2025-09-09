import type { DashboardMetrics } from '@shared/types';

// @ts-expect-error analytics types were removed from '@shared/types'
import type { AuditLogsResponse } from '@shared/types';

// This file does not run; compilation is sufficient.
const example: DashboardMetrics = { online: 0, revenue: 0, activity: [], errors: [] };
console.log(example.online);
