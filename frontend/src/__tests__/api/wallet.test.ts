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

jest.mock('@shared/wallet.schema', () => {
  const { z } = require('zod');
  const AmountSchema = z.object({
    amount: z.number().int().positive(),
    currency: z.string(),
  });
  const AmountDeviceSchema = AmountSchema.extend({ deviceId: z.string() });
  const WalletStatusResponseSchema = z.object({
    kycVerified: z.boolean(),
    realBalance: z.number(),
    creditBalance: z.number(),
    currency: z.string(),
  });
  const BankDetailsSchema = z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    routingCode: z.string(),
  });
  return {
    AmountSchema,
    WithdrawSchema: AmountDeviceSchema,
    DepositSchema: AmountDeviceSchema,
    BankTransferDepositRequestSchema: AmountDeviceSchema.extend({
      idempotencyKey: z.string().optional(),
    }),
    BankTransferDepositResponseSchema: z.object({
      reference: z.string(),
      bank: BankDetailsSchema,
    }),
    WalletStatusResponseSchema,
    WalletTransactionsResponseSchema: z.any(),
    PendingTransactionsResponseSchema: z.any(),
    PendingDepositsResponseSchema: z.any(),
    DepositDecisionRequestSchema: z.any(),
    IbanResponseSchema: z.any(),
    IbanHistoryResponseSchema: z.any(),
  };
});

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
          currency: 'EUR',
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
          currency: 'EUR',
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
          currency: 'EUR',
        }),
      });

    await expect(reserve('u1', 10, 'EUR')).resolves.toEqual({ message: 'ok' });
    await expect(commit('u1', 10, 'EUR')).resolves.toEqual({ message: 'ok' });
    await expect(rollback('u1', 10, 'EUR')).resolves.toEqual({ message: 'ok' });
    await expect(deposit('u1', 10, 'd1', 'EUR')).resolves.toEqual({
      kycVerified: true,
      realBalance: 20,
      creditBalance: 10,
      currency: 'EUR',
    });
    await expect(
      initiateBankTransfer('u1', 10, 'd1', 'EUR', 'idem1'),
    ).resolves.toEqual({
      reference: 'ref1',
      bank: {
        bankName: 'Bank',
        accountNumber: '123',
        routingCode: '456',
      },
    });
    await expect(withdraw('u1', 10, 'd1', 'EUR')).resolves.toEqual({
      kycVerified: true,
      realBalance: 10,
      creditBalance: 5,
      currency: 'EUR',
    });
    await expect(getStatus('u1')).resolves.toEqual({
      kycVerified: true,
      realBalance: 20,
      creditBalance: 10,
      currency: 'EUR',
    });
  });

  it('validates deposit and withdraw payloads', () => {
    (serverFetch as jest.Mock).mockClear();
    expect(() => deposit('u1', -1, 'd1', 'EUR')).toThrow();
    expect(serverFetch).not.toHaveBeenCalled();
    (serverFetch as jest.Mock).mockClear();
    expect(() => withdraw('u1', 10, 123 as any, 'EUR')).toThrow();
    expect(serverFetch).not.toHaveBeenCalled();
  });
});
