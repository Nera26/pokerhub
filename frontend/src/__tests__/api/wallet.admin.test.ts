import { apiClient } from '@/lib/api/client';
import {
  confirmDeposit,
  rejectDeposit,
  confirmWithdrawal,
  rejectWithdrawal,
  adminAdjustBalance,
  reconcileDeposits,
} from '@/lib/api/wallet';
import { fetchTransactionsLog } from '@/lib/api/transactions';
import { PendingDepositsResponseSchema } from '@shared/wallet.schema';
import {
  PendingWithdrawalsResponseSchema,
  MessageResponseSchema,
} from '@shared/types';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
}));

const apiClientMock = apiClient as jest.Mock;

describe('wallet admin api client', () => {
  beforeEach(() => apiClientMock.mockResolvedValue({}));
  afterEach(() => apiClientMock.mockReset());

  it('confirmDeposit posts to endpoint', async () => {
    await confirmDeposit('123');
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/deposits/123/confirm',
      MessageResponseSchema,
      { method: 'POST', signal: undefined },
    );
  });

  it('confirmWithdrawal posts to endpoint', async () => {
    await confirmWithdrawal('w1');
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/withdrawals/w1/confirm',
      MessageResponseSchema,
      { method: 'POST', signal: undefined },
    );
  });

  it('rejectWithdrawal sends body', async () => {
    await rejectWithdrawal('abc', 'nope');
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/withdrawals/abc/reject',
      MessageResponseSchema,
      { method: 'POST', body: { comment: 'nope' }, signal: undefined },
    );
  });

  it('fetchTransactionsLog calls endpoint', async () => {
    await fetchTransactionsLog();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/transactions?page=1&pageSize=10',
      expect.anything(),
      { signal: undefined },
    );
  });

  it('fetchTransactionsLog supports pagination params', async () => {
    await fetchTransactionsLog({ page: 2, pageSize: 25 });
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/transactions?page=2&pageSize=25',
      expect.anything(),
      { signal: undefined },
    );
  });

  it('fetchTransactionsLog includes date filters', async () => {
    await fetchTransactionsLog({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/transactions?startDate=2024-01-01&endDate=2024-01-31&page=1&pageSize=10',
      expect.anything(),
      { signal: undefined },
    );
  });

  it('PendingDepositsResponseSchema parses new fields', () => {
    const sample = {
      deposits: [
        {
          id: 'dep1',
          userId: 'u1',
          amount: 10,
          currency: 'USD',
          reference: 'ref',
          status: 'pending',
          actionRequired: true,
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          avatar: '',
          method: 'bank-transfer',
        },
      ],
    };
    expect(() => PendingDepositsResponseSchema.parse(sample)).not.toThrow();
  });

  it('PendingWithdrawalsResponseSchema parses with optional bankInfo', () => {
    const withInfo = {
      withdrawals: [
        {
          id: 'w1',
          userId: 'u1',
          amount: 20,
          currency: 'USD',
          status: 'pending',
          createdAt: new Date().toISOString(),
          avatar: '',
          bank: 'Bank',
          maskedAccount: '****1234',
          bankInfo: 'Bank ****1234',
        },
      ],
    };
    const withoutInfo = {
      withdrawals: [
        {
          id: 'w2',
          userId: 'u2',
          amount: 30,
          currency: 'USD',
          status: 'pending',
          createdAt: new Date().toISOString(),
          avatar: '',
          bank: 'Bank',
          maskedAccount: '****5678',
        },
      ],
    };
    expect(() =>
      PendingWithdrawalsResponseSchema.parse(withInfo),
    ).not.toThrow();
    expect(() =>
      PendingWithdrawalsResponseSchema.parse(withoutInfo),
    ).not.toThrow();
  });

  it('adminAdjustBalance posts to endpoint', async () => {
    await adminAdjustBalance('u1', {
      action: 'add',
      amount: 10,
      currency: 'USD',
      notes: 'n',
    });
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/balance/u1',
      MessageResponseSchema,
      {
        method: 'POST',
        body: {
          action: 'add',
          amount: 10,
          currency: 'USD',
          notes: 'n',
        },
        signal: undefined,
      },
    );
  });

  it('reconcileDeposits posts manual entries as JSON', async () => {
    await reconcileDeposits({
      entries: [{ reference: 'abc', amount: 1500 }],
    });
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/deposits/reconcile',
      MessageResponseSchema,
      {
        method: 'POST',
        body: { entries: [{ reference: 'abc', amount: 1500 }] },
        signal: undefined,
      },
    );
  });

  it('reconcileDeposits uploads CSV via FormData', async () => {
    const file = new File(['reference,amount\nabc,100\n'], 'recon.csv', {
      type: 'text/csv',
    });
    await reconcileDeposits({ file });
    const call = apiClientMock.mock.calls.at(-1);
    expect(call?.[0]).toBe('/api/admin/deposits/reconcile');
    expect(call?.[1]).toBe(MessageResponseSchema);
    const options = call?.[2] as { body: FormData };
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('file')).toBe(file);
  });
});
