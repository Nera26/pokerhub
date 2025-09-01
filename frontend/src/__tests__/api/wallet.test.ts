/** @jest-environment node */

import {
  reserve,
  commit,
  rollback,
  deposit,
  withdraw,
  getStatus,
} from '@/lib/api/wallet';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('wallet api', () => {
  it('handles reserve/commit/rollback/deposit/withdraw', async () => {
    (serverFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ id: 'ch' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          kycVerified: true,
          realBalance: 20,
          creditBalance: 10,
        }),
      });

    await expect(reserve(10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(commit(10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(rollback(10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(deposit(10, 'd1', 'USD')).resolves.toEqual({ id: 'ch' });
    await expect(withdraw(10, 'd1', 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(getStatus()).resolves.toEqual({
      kycVerified: true,
      realBalance: 20,
      creditBalance: 10,
    });
  });
});
