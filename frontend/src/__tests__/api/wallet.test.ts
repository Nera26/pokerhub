/** @jest-environment node */

import { reserve, commit, rollback, withdraw, getStatus } from '@/lib/api/wallet';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('wallet api', () => {
  it('handles reserve/commit/rollback/withdraw', async () => {
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
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ kycVerified: true }),
      });

    await expect(reserve('u1', 10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(commit('u1', 10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(rollback('u1', 10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(withdraw('u1', 10, 'd1', 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(getStatus('u1')).resolves.toEqual({ kycVerified: true });
  });
});
