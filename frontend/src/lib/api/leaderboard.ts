/* istanbul ignore file */
import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiError } from './client';
import {
  LeaderboardEntry,
  LeaderboardResponseSchema,
  StatusResponseSchema,
  LeaderboardRangesResponseSchema,
  type LeaderboardRangesResponse,
  type StatusResponse,
} from '@shared/types';

export async function fetchLeaderboard(
  { signal }: { signal?: AbortSignal } = {},
): Promise<LeaderboardEntry[]> {
  return await apiClient('/api/leaderboard', LeaderboardResponseSchema, {
    signal,
  });
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
