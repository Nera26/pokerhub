/* istanbul ignore file */
import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import {
  LeaderboardEntry,
  LeaderboardResponseSchema,
  StatusResponseSchema,
  type StatusResponse,
} from '@shared/types';

export async function fetchLeaderboard({
  signal,
}: { signal?: AbortSignal } = {}): Promise<LeaderboardEntry[]> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/leaderboard`, {
    credentials: 'include',
    signal,
  });
  return handleResponse(res, LeaderboardResponseSchema);
}

export async function rebuildLeaderboard(
  days = 30,
): Promise<StatusResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/leaderboard/rebuild?days=${days}`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(res, StatusResponseSchema);
}
