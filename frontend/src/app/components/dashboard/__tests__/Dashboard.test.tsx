import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';
import {
  fetchTransactionsLog,
  fetchTransactionTypes,
  fetchAdminPlayers,
} from '@/lib/api/wallet';

const metricsMock = jest.fn();
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => metricsMock(),
}));

jest.mock('@/app/components/dashboard/charts/ActivityChart', () => ({
  __esModule: true,
  default: ({ data }: { data: number[] }) => (
    <div data-testid="activity-chart">{data.join(',')}</div>
  ),
}));

jest.mock('@/app/components/dashboard/charts/RevenueDonut', () => ({
  __esModule: true,
  default: ({ data }: { data: number[] }) => (
    <div data-testid="revenue-donut">{data.join(',')}</div>
  ),
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
    metricsMock.mockReturnValue({ data: {}, isLoading: false, error: null });
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
    const lastCallArgs = calls[calls.length - 1][0];
    expect(lastCallArgs).toMatchObject({ page: 2, pageSize: 10 });
  });
});

describe('Dashboard metrics', () => {
  beforeEach(() => {
    metricsMock.mockReset();
  });

  it('shows loading state', () => {
    metricsMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithClient(<Dashboard />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    metricsMock.mockReturnValue({ data: undefined, isLoading: false, error: new Error('fail') });
    renderWithClient(<Dashboard />);
    expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
  });

  it('renders metrics when loaded', () => {
    metricsMock.mockReturnValue({
      data: {
        online: 5,
        tables: { open: 2, full: 1 },
        tournaments: { total: 3, running: 1 },
        revenue: { today: { amount: 100, trend: 'trend' } },
        deposits: { today: { amount: 50, trend: 'trend' } },
        withdrawals: { today: { amount: 25, trend: 'trend' } },
        activity: { today: [1, 2, 3] },
        revenueBreakdown: { today: [60, 30, 10] },
        revenueValues: { today: [6000, 3000, 1000] },
      },
      isLoading: false,
      error: null,
    });
    renderWithClient(<Dashboard />);
    expect(
      screen.getByText(/active users/i).parentElement?.textContent,
    ).toMatch(/5/);

    const revenueLabel = screen.getAllByText(/revenue/i)[0];
    expect(revenueLabel.parentElement?.textContent).toMatch(/\$100/);
  });

  it('updates revenue when filter changes', async () => {
    metricsMock.mockReturnValue({
      data: {
        online: 0,
        tables: { open: 0, full: 0 },
        tournaments: { total: 0, running: 0 },
        revenue: {
          today: { amount: 100, trend: 't' },
          week: { amount: 200, trend: 't' },
        },
        deposits: { today: { amount: 0, trend: '' } },
        withdrawals: { today: { amount: 0, trend: '' } },
        activity: { today: [1], week: [2] },
        revenueBreakdown: { today: [1], week: [2] },
        revenueValues: { today: [1], week: [2] },
      },
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithClient(<Dashboard />);

    const revenueLabel = screen.getByText(/revenue/i, { selector: 'p' });
    const revenueCard = revenueLabel.closest('div')!;
    const select = within(revenueCard).getByRole('combobox');

    await user.selectOptions(select, 'week');
    expect(within(revenueCard).getByText('$200')).toBeInTheDocument();
  });
});
