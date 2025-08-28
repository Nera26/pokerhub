/** @jest-environment node */

import { getTables } from '@/lib/api/lobby';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('lobby api', () => {
  it('fetches tables', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [
        {
          id: '1',
          tableName: 'Test Table',
          gameType: 'texas',
          stakes: { small: 1, big: 2 },
          players: { current: 1, max: 6 },
          buyIn: { min: 40, max: 200 },
          stats: { handsPerHour: 10, avgPot: 5, rake: 1 },
          createdAgo: '1m',
        },
      ],
    });

    await expect(getTables()).resolves.toEqual([
      {
        id: '1',
        tableName: 'Test Table',
        gameType: 'texas',
        stakes: { small: 1, big: 2 },
        players: { current: 1, max: 6 },
        buyIn: { min: 40, max: 200 },
        stats: { handsPerHour: 10, avgPot: 5, rake: 1 },
        createdAgo: '1m',
      },
    ]);
  });

  it('throws ApiError on failure', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'fail',
    });

    await expect(getTables()).rejects.toEqual({
      status: 500,
      message: 'Server Error',
      details: 'fail',
    });
  });
});
