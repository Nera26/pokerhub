import { apiClient, type ApiError } from './client';
import {
  AdminOverviewResponseSchema,
  type AdminOverview,
  LogTypeClassesSchema,
  type LogTypeClasses,
  ActivityResponseSchema,
  type ActivityResponse,
} from '@shared/types';
import { z } from 'zod';

const ErrorCategoriesResponseSchema = z.object({
  labels: z.array(z.string()),
  counts: z.array(z.number()),
});
export type ErrorCategoriesResponse = z.infer<
  typeof ErrorCategoriesResponseSchema
>;

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

export function fetchErrorCategories({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ErrorCategoriesResponse> {
  return apiClient(
    '/api/analytics/error-categories',
    ErrorCategoriesResponseSchema,
    { signal },
  );
}

export async function fetchActivity({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ActivityResponse> {
  try {
    return await apiClient('/api/analytics/activity', ActivityResponseSchema, {
      signal,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch activity: ${message}` } as ApiError;
  }
}
