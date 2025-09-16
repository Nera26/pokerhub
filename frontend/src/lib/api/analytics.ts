import { safeApiClient } from './utils';
import { apiClient } from './client';
import {
  LogTypeClassesSchema,
  type LogTypeClasses,
  ActivityResponseSchema,
  type ActivityResponse,
  ChartPaletteResponseSchema,
  type ChartPaletteResponse,
  ErrorCategoriesResponseSchema,
  type ErrorCategoriesResponse,
} from '@shared/types';

export function fetchLogTypeClasses(): Promise<LogTypeClasses> {
  return safeApiClient('/api/admin/log-types', LogTypeClassesSchema, {
    errorMessage: 'Failed to fetch log type classes',
  });
}

export function fetchErrorCategories({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ErrorCategoriesResponse> {
  return safeApiClient(
    '/api/analytics/error-categories',
    ErrorCategoriesResponseSchema,
    { signal, errorMessage: 'Failed to fetch error categories' },
  );
}

export async function fetchActivity({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ActivityResponse> {
  return safeApiClient('/api/analytics/activity', ActivityResponseSchema, {
    signal,
    errorMessage: 'Failed to fetch activity',
  });
}

export async function updateChartPalette(
  palette: string[],
  { signal }: { signal?: AbortSignal } = {},
): Promise<ChartPaletteResponse> {
  return apiClient('/api/settings/chart-palette', ChartPaletteResponseSchema, {
    method: 'PUT',
    body: palette,
    signal,
  });
}
