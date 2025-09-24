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
    `/leaderboard/rebuild?days=${days}`,
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
