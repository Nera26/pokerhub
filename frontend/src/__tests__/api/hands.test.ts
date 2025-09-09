/** @jest-environment node */

import {
  fetchHandProof,
  fetchHandLog,
  fetchHandState,
  fetchVerifiedHandProof,
} from '@/lib/api/hands';
import { serverFetch } from '@/lib/server-fetch';
import { verifyProof } from '@shared/verify';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));
jest.mock('@shared/verify', () => ({
  verifyProof: jest.fn(),
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

  it('fetches and verifies hand proof', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ seed: 'aa', nonce: 'bb', commitment: 'cc' }),
    });
    (verifyProof as jest.Mock).mockReturnValue(true);

    await expect(fetchVerifiedHandProof('1')).resolves.toEqual({
      proof: { seed: 'aa', nonce: 'bb', commitment: 'cc' },
      valid: true,
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

  it('throws on non-ok hand log response', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'boom',
    });

    await expect(fetchHandLog('1')).rejects.toThrow('Failed to fetch hand log');
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
