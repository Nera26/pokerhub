import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';
import {
  fetchTransactionsLog,
  fetchTransactionTypes,
  fetchAdminPlayers,
} from '@/lib/api/wallet';

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({ data: {}, isLoading: false, error: null }),
}));

jest.mock('@/lib/api/wallet', () => ({
  fetchTransactionsLog: jest.fn(),
  fetchTransactionTypes: jest.fn(),
  fetchAdminPlayers: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Dashboard transaction log', () => {
  beforeEach(() => {
    (fetchTransactionTypes as jest.Mock).mockResolvedValue([]);
    (fetchAdminPlayers as jest.Mock).mockResolvedValue([]);
  });

  it('shows loading spinner', async () => {
    (fetchTransactionsLog as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithClient(<Dashboard />);
    expect(screen.getByText(/loading transactions/i)).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([]);
    renderWithClient(<Dashboard />);
    expect(await screen.findByText(/no transactions found/i)).toBeInTheDocument();
  });

  it('renders rows', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([
      {
        datetime: '2024-01-01T00:00:00Z',
        action: 'Deposit',
        amount: 100,
        by: 'Alice',
        notes: 'note',
        status: 'completed',
      },
    ]);
    renderWithClient(<Dashboard />);
    expect(await screen.findByText('Deposit')).toBeInTheDocument();
  });

  it('fetches next page when Next clicked', async () => {
    const user = userEvent.setup();
    (fetchTransactionsLog as jest.Mock)
      .mockResolvedValueOnce([
        {
          datetime: '2024-01-01T00:00:00Z',
          action: 'Deposit',
          amount: 100,
          by: 'Alice',
          notes: 'note',
          status: 'completed',
        },
      ])
      .mockResolvedValueOnce([]);
    renderWithClient(<Dashboard />);
    await screen.findByText('Deposit');
    await user.click(screen.getByText('Next'));
    const calls = (fetchTransactionsLog as jest.Mock).mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall).toMatchObject({ page: 2, pageSize: 10 });
  });
});
