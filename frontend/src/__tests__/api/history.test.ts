/** @jest-environment node */

import {
  fetchGameHistory,
  fetchTournamentHistory,
  fetchTransactions,
} from '@/lib/api/history';

describe('history api', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset?.();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('fetches game history', async () => {
    const payload = {
      items: [
        {
          id: '1',
          type: 'cash',
          stakes: '$1/$2',
          buyin: '$100',
          date: '2023-01-01',
          profit: true,
          amount: 50,
          currency: 'USD',
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });
    await expect(fetchGameHistory()).resolves.toEqual(payload);
  });

  it('fetches tournament history', async () => {
    const payload = {
      items: [
        {
          id: 't1',
          name: 'Sunday Million',
          place: '1st',
          buyin: '$100',
          prize: '$1000',
          duration: '1h',
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });
    await expect(fetchTournamentHistory()).resolves.toEqual(payload);
  });

  it('fetches transactions', async () => {
    const payload = {
      items: [
        {
          date: 'May 1',
          type: 'Deposit',
          amount: 100,
          currency: 'USD',
          status: 'Completed',
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });
    await expect(fetchTransactions()).resolves.toEqual(payload);
  });
});
