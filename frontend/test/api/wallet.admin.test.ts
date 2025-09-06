import { apiClient } from '@/lib/api/client';
import {
  fetchPendingDeposits,
  confirmDeposit,
  rejectDeposit,
  fetchPendingWithdrawals,
  confirmWithdrawal,
  rejectWithdrawal,
} from '@/lib/api/wallet';
import {
  PendingDepositsResponseSchema,
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
});
