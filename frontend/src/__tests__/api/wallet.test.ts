/** @jest-environment node */

import {
  reserve,
  commit,
  rollback,
  deposit,
  initiateBankTransfer,
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
        json: async () => ({
          kycVerified: true,
          realBalance: 20,
          creditBalance: 10,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          reference: 'ref1',
          bank: {
            bankName: 'Bank',
            accountNumber: '123',
            routingCode: '456',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          kycVerified: true,
          realBalance: 10,
          creditBalance: 5,
        }),
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

    await expect(reserve('u1', 10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(commit('u1', 10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(rollback('u1', 10, 'USD')).resolves.toEqual({ message: 'ok' });
    await expect(deposit('u1', 10, 'd1', 'USD')).resolves.toEqual({
      kycVerified: true,
      realBalance: 20,
      creditBalance: 10,
    });
    await expect(
      initiateBankTransfer('u1', 10, 'd1', 'USD', 'idem1'),
    ).resolves.toEqual({
      reference: 'ref1',
      bank: {
        bankName: 'Bank',
        accountNumber: '123',
        routingCode: '456',
      },
    });
    await expect(withdraw('u1', 10, 'd1', 'USD')).resolves.toEqual({
      kycVerified: true,
      realBalance: 10,
      creditBalance: 5,
    });
    await expect(getStatus('u1')).resolves.toEqual({
      kycVerified: true,
      realBalance: 20,
      creditBalance: 10,
    });
  });
});
