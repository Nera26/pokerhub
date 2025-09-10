/** @jest-environment node */

import { fetchTables, fetchTournamentDetails } from '@/lib/api/lobby';

describe('lobby api', () => {
  it('fetches tables', async () => {
    (fetch as jest.Mock).mockResolvedValue({
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

    await expect(fetchTables()).resolves.toEqual([
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
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'fail',
    });

    await expect(fetchTables()).rejects.toEqual({
      status: 500,
      message: 'Server Error',
      details: 'fail',
    });
  });

  it('fetches tournament details', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        id: 't1',
        title: 'Spring Poker',
        buyIn: 100,
        prizePool: 1000,
        state: 'REG_OPEN',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
        registration: { open: null, close: null },
        overview: [{ title: 'Format', description: 'NLH' }],
        structure: [],
        prizes: [],
      }),
    });

    await expect(fetchTournamentDetails('t1')).resolves.toEqual({
      id: 't1',
      title: 'Spring Poker',
      buyIn: 100,
      prizePool: 1000,
      state: 'REG_OPEN',
      gameType: 'texas',
      players: { current: 0, max: 100 },
      registered: false,
      registration: { open: null, close: null },
      overview: [{ title: 'Format', description: 'NLH' }],
      structure: [],
      prizes: [],
    });
  });

  it('throws ApiError when tournament details request fails', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'missing',
    });

    await expect(fetchTournamentDetails('x')).rejects.toEqual({
      status: 404,
      message: 'Not Found',
      details: 'missing',
    });
  });
});
