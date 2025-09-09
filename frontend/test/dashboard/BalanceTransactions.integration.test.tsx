import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BalanceTransactions from '@/app/components/dashboard/BalanceTransactions';
import {
  fetchPendingDeposits,
  fetchPendingWithdrawals,
  fetchBalances,
  fetchTransactionsLog,
  fetchTransactionTabs,
  fetchTransactionTypes,
  adminAdjustBalance,
  confirmDeposit,
  rejectDeposit,
  confirmWithdrawal,
  rejectWithdrawal,
} from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet');

jest.mock('@/hooks/wallet', () => ({
  useIban: () => ({ data: {} }),
  useIbanHistory: () => ({ data: { history: [] } }),
  useWalletReconcileMismatches: () => ({
    data: { mismatches: [] },
    isLoading: false,
    error: null,
  }),
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <BalanceTransactions />
    </QueryClientProvider>,
  );
}

describe('BalanceTransactions manage balance integration', () => {
  beforeEach(() => {
    (fetchPendingDeposits as jest.Mock).mockResolvedValue({ deposits: [] });
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue([]);
    (fetchTransactionTabs as jest.Mock).mockResolvedValue([]);
    (fetchTransactionTypes as jest.Mock).mockResolvedValue([]);
    (confirmDeposit as jest.Mock).mockResolvedValue({});
    (rejectDeposit as jest.Mock).mockResolvedValue({});
    (confirmWithdrawal as jest.Mock).mockResolvedValue({});
    (rejectWithdrawal as jest.Mock).mockResolvedValue({});
    (adminAdjustBalance as jest.Mock).mockResolvedValue({ message: 'ok' });
    (fetchBalances as jest.Mock)
      .mockResolvedValueOnce([
        {
          user: 'u1',
          avatar: '',
          balance: 100,
          status: 'Active',
          lastActivity: 'now',
        },
      ])
      .mockResolvedValueOnce([
        {
          user: 'u1',
          avatar: '',
          balance: 150,
          status: 'Active',
          lastActivity: 'now',
        },
      ]);
    (fetchTransactionsLog as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          datetime: '2024-01-01 00:00',
          action: 'Manual Add',
          amount: 50,
          by: 'Admin_You',
          notes: 'bonus',
          status: 'Completed',
        },
      ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updates balance after manage balance and refetch', async () => {
    setup();
    await screen.findByText('Manage Balance');
    await userEvent.click(
      screen.getByRole('button', { name: 'Manage Balance' }),
    );
    await userEvent.type(screen.getByPlaceholderText('0.00'), '50');
    await userEvent.type(
      screen.getByPlaceholderText('Reason for balance change...'),
      'bonus',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(adminAdjustBalance).toHaveBeenCalled());
    await waitFor(() => expect(fetchBalances).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('$150')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        (fetchTransactionsLog as jest.Mock).mock.calls.length,
      ).toBeGreaterThanOrEqual(2),
    );
    expect(await screen.findByText('Manual Add')).toBeInTheDocument();
  });
});
