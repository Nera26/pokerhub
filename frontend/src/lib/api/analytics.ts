import { safeApiClient } from './utils';
import { apiClient } from './client';
import {
  AuditLogEntrySchema,
  type AuditLogEntry,
  LogTypeClassesSchema,
  type LogTypeClasses,
  ActivityResponseSchema,
  type ActivityResponse,
  ChartPaletteResponseSchema,
  type ChartPaletteResponse,
  ErrorCategoriesResponseSchema,
  type ErrorCategoriesResponse,
  AlertItemSchema,
  type AlertItem,
} from '@shared/types';

export function fetchLogTypeClasses(): Promise<LogTypeClasses> {
  return safeApiClient(
    '/api/analytics/log-types/classes',
    LogTypeClassesSchema,
    {
      errorMessage: 'Failed to fetch log type classes',
    },
  );
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

export async function markAuditLogReviewed(
  id: AuditLogEntry['id'],
  { signal }: { signal?: AbortSignal } = {},
): Promise<AuditLogEntry> {
  const encodedId = encodeURIComponent(String(id));
  return apiClient(
    `/api/admin/audit-logs/${encodedId}/review`,
    AuditLogEntrySchema,
    {
      method: 'POST',
      signal,
    },
  );
}

export async function acknowledgeSecurityAlert(
  id: AlertItem['id'],
  { signal }: { signal?: AbortSignal } = {},
): Promise<AlertItem> {
  const encodedId = encodeURIComponent(String(id));
  return apiClient(
    `/api/admin/security-alerts/${encodedId}/ack`,
    AlertItemSchema,
    {
      method: 'POST',
      signal,
    },
  );
}
