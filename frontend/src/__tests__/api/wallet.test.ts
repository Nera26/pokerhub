/** @jest-environment node */

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

import {
  reserve,
  commit,
  rollback,
  deposit,
  initiateBankTransfer,
  withdraw,
  getStatus,
  fetchIbanDetails,
} from '@/lib/api/wallet';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();
const fetchSpy = jest.fn((input: RequestInfo, init?: RequestInit) =>
  server.fetch(input, init),
);

beforeAll(() => {
  server.listen();
  // @ts-expect-error override for tests
  global.fetch = fetchSpy;
});

afterEach(() => {
  server.resetHandlers();
  fetchSpy.mockReset();
});

afterAll(() => {
  server.close();
});

describe('wallet api', () => {
  it('handles reserve/commit/rollback/deposit/withdraw', async () => {
    server.use(
      http.post('http://localhost:3000/api/wallet/u1/reserve', () =>
        HttpResponse.json({ message: 'ok' }),
      ),
      http.post('http://localhost:3000/api/wallet/u1/commit', () =>
        HttpResponse.json({ message: 'ok' }),
      ),
      http.post('http://localhost:3000/api/wallet/u1/rollback', () =>
        HttpResponse.json({ message: 'ok' }),
      ),
      http.post('http://localhost:3000/api/wallet/u1/deposit', () =>
        HttpResponse.json({
          kycVerified: true,
          realBalance: 20,
          creditBalance: 10,
          currency: 'EUR',
        }),
      ),
      http.post(
        'http://localhost:3000/api/wallet/u1/deposit/bank-transfer',
        () =>
          HttpResponse.json({
            reference: 'ref1',
            bank: {
              bankName: 'Bank',
              accountNumber: '123',
              routingCode: '456',
            },
          }),
      ),
      http.post('http://localhost:3000/api/wallet/u1/withdraw', () =>
        HttpResponse.json({
          kycVerified: true,
          realBalance: 10,
          creditBalance: 5,
          currency: 'EUR',
        }),
      ),
      http.get('http://localhost:3000/api/wallet/u1/status', () =>
        HttpResponse.json({
          kycVerified: true,
          realBalance: 20,
          creditBalance: 10,
          currency: 'EUR',
        }),
      ),
    );

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
    fetchSpy.mockClear();
    expect(() => deposit('u1', -1, 'd1', 'EUR')).toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockClear();
    expect(() => withdraw('u1', 10, 123 as any, 'EUR')).toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetchIbanDetails handles API failure', async () => {
    server.use(
      http.get('http://localhost:3000/api/wallet/iban', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 }),
      ),
    );
    await expect(fetchIbanDetails()).rejects.toMatchObject({
      status: 500,
      message: 'fail',
    });
  });
});
