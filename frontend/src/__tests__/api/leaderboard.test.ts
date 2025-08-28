/** @jest-environment node */

import { fetchLeaderboard } from '@/lib/api/leaderboard';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('leaderboard api', () => {
  it('fetches leaderboard', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [
        { playerId: 'alice', rank: 1, points: 100 },
        { playerId: 'bob', rank: 2, points: 90 },
      ],
    });

    await expect(fetchLeaderboard()).resolves.toEqual([
      { playerId: 'alice', rank: 1, points: 100 },
      { playerId: 'bob', rank: 2, points: 90 },
    ]);
  });
});
