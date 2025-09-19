jest.mock('@shared/wallet.schema', () => {
  const { z } = require('zod');
  const CurrencySchema = z.string().length(3);
  const AmountSchema = z.object({
    amount: z.number().int().positive(),
    currency: CurrencySchema,
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
    CurrencySchema,
    AmountSchema,
    WithdrawSchema: AmountDeviceSchema,
    DepositSchema: AmountDeviceSchema,
    BankTransferDepositRequestSchema: AmountDeviceSchema.extend({
      ip: z.string().optional(),
      idempotencyKey: z.string().optional(),
    }),
    BankTransferDepositResponseSchema: z.object({
      reference: z.string(),
      bank: BankDetailsSchema,
    }),
    WalletStatusResponseSchema,
    WalletReconcileMismatchesResponseSchema: z.any(),
    WalletReconcileMismatchAcknowledgementSchema: z.any(),
    WalletTransactionsResponseSchema: z.any(),
    PendingTransactionsResponseSchema: z.any(),
    PendingDepositsResponseSchema: z.any(),
    DepositDecisionRequestSchema: z.any(),
    IbanResponseSchema: z.any(),
    IbanHistoryResponseSchema: z.any(),
    IbanUpdateRequestSchema: z.any(),
    IbanDetailsSchema: z.any(),
    WalletStatusSchema: WalletStatusResponseSchema,
    AdminBalanceRequestSchema: z.any(),
  };
});

import {
  deposit,
  initiateBankTransfer,
  withdraw,
  getStatus,
  fetchIbanDetails,
} from '@/lib/api/wallet';
import { server } from '@/test-utils/server';
import { mockSuccess, mockError } from '@/test-utils/handlers';

describe('wallet api', () => {
  it('handles deposit/withdraw and status lookups', async () => {
    server.use(
      mockSuccess(
        {
          kycVerified: true,
          realBalance: 20,
          creditBalance: 10,
          currency: 'EUR',
        },
        { once: true },
      ),
      mockSuccess(
        {
          reference: 'ref1',
          bank: {
            bankName: 'Bank',
            accountNumber: '123',
            routingCode: '456',
          },
        },
        { once: true },
      ),
      mockSuccess(
        {
          kycVerified: true,
          realBalance: 10,
          creditBalance: 5,
          currency: 'EUR',
        },
        { once: true },
      ),
      mockSuccess(
        {
          kycVerified: true,
          realBalance: 20,
          creditBalance: 10,
          currency: 'EUR',
        },
        { once: true },
      ),
    );

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
    (fetch as jest.Mock).mockClear();
    expect(() => deposit('u1', -1, 'd1', 'EUR')).toThrow();
    expect(fetch).not.toHaveBeenCalled();
    (fetch as jest.Mock).mockClear();
    expect(() => withdraw('u1', 10, 123 as any, 'EUR')).toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetchIbanDetails handles API failure', async () => {
    server.use(mockError({ message: 'fail' }, { status: 500 }));
    await expect(fetchIbanDetails()).rejects.toMatchObject({
      status: 500,
      message: 'fail',
    });
  });
});
