import { apiClient } from './client';
import {
  AdminOverviewResponseSchema,
  type AdminOverview,
  LogTypeClassesSchema,
  type LogTypeClasses,
} from '@shared/types';

export async function fetchAdminOverview({
  signal,
}: { signal?: AbortSignal } = {}): Promise<AdminOverview[]> {
  return apiClient(
    '/api/analytics/admin-overview',
    AdminOverviewResponseSchema,
    {
      signal,
    },
  );
}

export function fetchLogTypeClasses(): Promise<LogTypeClasses> {
  return apiClient('/api/admin/log-types', LogTypeClassesSchema);
}
