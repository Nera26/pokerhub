/* istanbul ignore file */
import { apiClient } from './client';
import {
  LeaderboardEntry,
  LeaderboardResponseSchema,
  StatusResponseSchema,
  type StatusResponse,
} from '@shared/types';

export async function fetchLeaderboard({
  signal,
}: { signal?: AbortSignal } = {}): Promise<LeaderboardEntry[]> {
  return apiClient('/api/leaderboard', LeaderboardResponseSchema, {
    signal,
  });
}

export async function rebuildLeaderboard(
  days = 30,
): Promise<StatusResponse> {
  return apiClient(`/api/leaderboard/rebuild?days=${days}`, StatusResponseSchema, {
    method: 'POST',
  });
}
