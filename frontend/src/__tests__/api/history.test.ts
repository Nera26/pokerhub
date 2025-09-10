/** @jest-environment node */

import {
  fetchGameHistory,
  fetchTournamentHistory,
  fetchTransactions,
} from '@/lib/api/history';

describe('history api', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockReset?.();
  });

  it('fetches game history', async () => {
    const payload = [
      {
        id: '1',
        type: 'cash',
        stakes: '$1/$2',
        buyin: '$100',
        date: '2023-01-01',
        profit: true,
        amount: '+$50',
      },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });
    await expect(fetchGameHistory()).resolves.toEqual(payload);
  });

  it('fetches tournament history', async () => {
    const payload = [
      {
        name: 'Sunday Million',
        place: '1st',
        buyin: '$100',
        prize: '$1000',
        duration: '1h',
      },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });
    await expect(fetchTournamentHistory()).resolves.toEqual(payload);
  });

  it('fetches transactions', async () => {
    const payload = [
      { date: 'May 1', type: 'Deposit', amount: '+$100', status: 'Completed' },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });
    await expect(fetchTransactions()).resolves.toEqual(payload);
  });
});
