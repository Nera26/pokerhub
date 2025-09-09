/** @jest-environment node */

import { fetchLeaderboard } from '@/lib/api/leaderboard';
import { leaderboard } from '../fixtures/leaderboard';

describe('leaderboard api', () => {
  it('fetches leaderboard', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => leaderboard,
    });

    await expect(fetchLeaderboard()).resolves.toEqual(leaderboard);
  });
});
