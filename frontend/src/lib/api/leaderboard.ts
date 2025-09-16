/* istanbul ignore file */
import { useQuery } from '@tanstack/react-query';
import type { ZodTypeAny, output as ZodOutput } from 'zod';
import { apiClient, type ApiError } from './client';
import {
  LeaderboardEntry,
  LeaderboardResponseSchema,
  StatusResponseSchema,
  LeaderboardRangesResponseSchema,
  LeaderboardModesResponseSchema,
  LeaderboardConfigListResponseSchema,
  type LeaderboardRangesResponse,
  type LeaderboardModesResponse,
  type StatusResponse,
  type TimeFilter,
  type LeaderboardConfig,
  type LeaderboardConfigListResponse,
  type LeaderboardConfigUpdate,
} from '@shared/types';

const ADMIN_LEADERBOARD_CONFIG_PATH = '/api/admin/leaderboard-config' as const;

export async function fetchLeaderboard({
  signal,
  range,
}: { signal?: AbortSignal; range?: TimeFilter } = {}): Promise<
  LeaderboardEntry[]
> {
  const query = range ? `?range=${range}` : '';
  return await apiClient(
    `/api/leaderboard${query}`,
    LeaderboardResponseSchema,
    {
      signal,
    },
  );
}

export async function rebuildLeaderboard(days = 30): Promise<StatusResponse> {
  return await apiClient(
    `/api/leaderboard/rebuild?days=${days}`,
    StatusResponseSchema,
    { method: 'POST' },
  );
}

export function createLeaderboardMetaQuery<TSchema extends ZodTypeAny>(
  key: string,
  path: string,
  schema: TSchema,
) {
  return useQuery<ZodOutput<TSchema>, ApiError>({
    queryKey: ['leaderboard', key] as const,
    queryFn: () => apiClient(path, schema),
  });
}

export function useLeaderboardRanges() {
  return createLeaderboardMetaQuery(
    'ranges',
    '/api/leaderboard/ranges',
    LeaderboardRangesResponseSchema,
  );
}

export function useLeaderboardModes() {
  return createLeaderboardMetaQuery(
    'modes',
    '/api/leaderboard/modes',
    LeaderboardModesResponseSchema,
  );
}

export async function listLeaderboardConfig(): Promise<LeaderboardConfigListResponse> {
  return apiClient(
    ADMIN_LEADERBOARD_CONFIG_PATH,
    LeaderboardConfigListResponseSchema,
  );
}

export async function createLeaderboardConfig(
  entry: LeaderboardConfig,
): Promise<LeaderboardConfigListResponse> {
  return apiClient(
    ADMIN_LEADERBOARD_CONFIG_PATH,
    LeaderboardConfigListResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify(entry),
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export async function updateLeaderboardConfig(
  payload: LeaderboardConfigUpdate,
): Promise<LeaderboardConfigListResponse> {
  return apiClient(
    ADMIN_LEADERBOARD_CONFIG_PATH,
    LeaderboardConfigListResponseSchema,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export async function deleteLeaderboardConfig(
  entry: LeaderboardConfig,
): Promise<LeaderboardConfigListResponse> {
  return apiClient(
    ADMIN_LEADERBOARD_CONFIG_PATH,
    LeaderboardConfigListResponseSchema,
    {
      method: 'DELETE',
      body: JSON.stringify(entry),
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
