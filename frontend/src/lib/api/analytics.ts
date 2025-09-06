import { apiClient } from './client';
export type { ApiError } from './client';
import { AdminOverviewResponseSchema, type AdminOverview } from '@shared/types';

export async function fetchAdminOverview({
  signal,
}: { signal?: AbortSignal } = {}): Promise<AdminOverview[]> {
  return apiClient('/api/analytics/admin-overview', AdminOverviewResponseSchema, {
    signal,
  });
}
