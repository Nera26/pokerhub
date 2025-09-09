/** @jest-environment node */

import { fetchLeaderboard } from '@/lib/api/leaderboard';
import { serverFetch } from '@/lib/server-fetch';
import { leaderboard } from '../fixtures/leaderboard';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('leaderboard api', () => {
  it('fetches leaderboard', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => leaderboard,
    });

    await expect(fetchLeaderboard()).resolves.toEqual(leaderboard);
  });
});
