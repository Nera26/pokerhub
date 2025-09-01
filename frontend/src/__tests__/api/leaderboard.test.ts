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
        {
          playerId: 'alice',
          rank: 1,
          points: 100,
          net: 10,
          bb100: 5,
          hours: 2,
          roi: 0.2,
          finishes: { 1: 1 },
        },
        {
          playerId: 'bob',
          rank: 2,
          points: 90,
          net: 8,
          bb100: 4,
          hours: 1.5,
          roi: -0.1,
          finishes: { 2: 1 },
        },
      ],
    });

    await expect(fetchLeaderboard()).resolves.toEqual([
      {
        playerId: 'alice',
        rank: 1,
        points: 100,
        net: 10,
        bb100: 5,
        hours: 2,
        roi: 0.2,
        finishes: { 1: 1 },
      },
      {
        playerId: 'bob',
        rank: 2,
        points: 90,
        net: 8,
        bb100: 4,
        hours: 1.5,
        roi: -0.1,
        finishes: { 2: 1 },
      },
    ]);
  });
});
