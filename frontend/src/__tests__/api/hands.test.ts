/** @jest-environment node */

import { fetchHandProof, fetchHandLog, fetchHandState } from '@/lib/api/hands';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('hands api', () => {
  it('fetches hand proof', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ seed: 'aa', nonce: 'bb', commitment: 'cc' }),
    });

    await expect(fetchHandProof('1')).resolves.toEqual({
      seed: 'aa',
      nonce: 'bb',
      commitment: 'cc',
    });
  });

  it('fetches hand log', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
      text: async () => 'line\n',
    });

    await expect(fetchHandLog('1')).resolves.toBe('line\n');
  });

  it('fetches hand state', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        street: 'preflop',
        pot: 0,
        sidePots: [],
        currentBet: 0,
        players: [],
      }),
    });

    await expect(fetchHandState('1', 0)).resolves.toEqual({
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: [],
    });
  });
});
