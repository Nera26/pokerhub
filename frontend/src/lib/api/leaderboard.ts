/* istanbul ignore file */
import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import { LeaderboardResponseSchema, type LeaderboardResponse } from '@shared/types';

export async function fetchLeaderboard({ signal }: { signal?: AbortSignal } = {}): Promise<LeaderboardResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/leaderboard`, {
    credentials: 'include',
    signal,
  });
  return handleResponse(res, LeaderboardResponseSchema);
}
