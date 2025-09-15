/* istanbul ignore file */
import { useQuery } from '@tanstack/react-query';
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

export function useLeaderboardRanges() {
  return useQuery<LeaderboardRangesResponse, ApiError>({
    queryKey: ['leaderboard', 'ranges'],
    queryFn: () =>
      apiClient('/api/leaderboard/ranges', LeaderboardRangesResponseSchema),
  });
}

export function useLeaderboardModes() {
  return useQuery<LeaderboardModesResponse, ApiError>({
    queryKey: ['leaderboard', 'modes'],
    queryFn: () =>
      apiClient('/api/leaderboard/modes', LeaderboardModesResponseSchema),
  });
}

export async function listLeaderboardConfig(): Promise<LeaderboardConfigListResponse> {
  return apiClient(
    '/api/admin/leaderboard-config',
    LeaderboardConfigListResponseSchema,
  );
}

export async function createLeaderboardConfig(
  entry: LeaderboardConfig,
): Promise<LeaderboardConfigListResponse> {
  return apiClient(
    '/api/admin/leaderboard-config',
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
    '/api/admin/leaderboard-config',
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
    '/api/admin/leaderboard-config',
    LeaderboardConfigListResponseSchema,
    {
      method: 'DELETE',
      body: JSON.stringify(entry),
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
