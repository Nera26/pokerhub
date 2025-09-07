import { apiClient } from '@/lib/api/client';
import {
  fetchPendingDeposits,
  confirmDeposit,
  rejectDeposit,
  fetchPendingWithdrawals,
  confirmWithdrawal,
  rejectWithdrawal,
  fetchBalances,
  fetchTransactionsLog,
} from '@/lib/api/wallet';
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

  it('fetchPendingDeposits calls correct endpoint', async () => {
    await fetchPendingDeposits();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/deposits',
      PendingDepositsResponseSchema,
      { signal: undefined },
    );
  });

  it('confirmDeposit posts to endpoint', async () => {
    await confirmDeposit('123');
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/deposits/123/confirm',
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

  it('fetchPendingWithdrawals calls endpoint', async () => {
    await fetchPendingWithdrawals();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/withdrawals',
      PendingWithdrawalsResponseSchema,
      { signal: undefined },
    );
  });

  it('fetchBalances calls endpoint', async () => {
    await fetchBalances();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/balances',
      expect.anything(),
      { signal: undefined },
    );
  });

  it('fetchTransactionsLog calls endpoint', async () => {
    await fetchTransactionsLog();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/transactions',
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

  it('PendingWithdrawalsResponseSchema parses new fields', () => {
    const sample = {
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
        },
      ],
    };
    expect(() => PendingWithdrawalsResponseSchema.parse(sample)).not.toThrow();
  });
});
