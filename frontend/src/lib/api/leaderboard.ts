/* istanbul ignore file */
import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiError } from './client';
import {
  LeaderboardEntry,
  LeaderboardResponseSchema,
  StatusResponseSchema,
  LeaderboardRangesResponseSchema,
  LeaderboardModesResponseSchema,
  type LeaderboardRangesResponse,
  type LeaderboardModesResponse,
  type StatusResponse,
  type TimeFilter,
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
