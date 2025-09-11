/** @jest-environment node */

import {
  fetchTables,
  fetchTournamentDetails,
  createCTA,
  updateCTA,
} from '@/lib/api/lobby';
import { mockFetch } from '@/test-utils/mockFetch';

describe('lobby api', () => {
  beforeAll(() => {
    // Ensure fetch exists in node test env
    if (!(global as any).fetch) {
      (global as any).fetch = jest.fn();
    }
  });

  beforeEach(() => {
    (fetch as jest.Mock).mockReset();
  });

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

  it('creates CTA via POST', async () => {
    const cta = {
      id: 'c1',
      label: 'Join',
      href: '/join',
      variant: 'primary',
    };
    mockFetch({ status: 200, payload: cta });

    await expect(createCTA(cta)).rejects.toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/ctas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(cta),
      }),
    );
  });

  it('updates CTA via PUT', async () => {
    const cta = {
      id: 'c1',
      label: 'Join',
      href: '/join',
      variant: 'primary',
    };
    mockFetch({ status: 200, payload: cta });

    await expect(updateCTA('c1', cta)).rejects.toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/ctas/c1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(cta),
      }),
    );
  });
});
