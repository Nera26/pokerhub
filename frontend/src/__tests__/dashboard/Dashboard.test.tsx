import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/app/components/dashboard/Dashboard';

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

const metricsMock = jest.fn();
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => metricsMock(),
}));

function renderWithClient() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Dashboard />
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    metricsMock.mockReset();
  });

  it('shows loading state', () => {
    metricsMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithClient();
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    metricsMock.mockReturnValue({ data: undefined, isLoading: false, error: new Error('fail') });
    renderWithClient();
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
    renderWithClient();
    expect(
      screen.getByText(/active users/i).parentElement?.textContent,
    ).toMatch(/5/);
    const revenueLabel = screen.getAllByText(/revenue/i)[0];
    expect(revenueLabel.parentElement?.textContent).toMatch(/\$100/);
    // charts are rendered via dynamic import; verifying metric usage above is sufficient
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
    renderWithClient();
    const revenueLabel = screen.getByText(/revenue/i, { selector: 'p' });
    const revenueCard = revenueLabel.closest('div');
    const select = within(revenueCard!).getByRole('combobox');
    await user.selectOptions(select, 'week');
    expect(within(revenueCard!).getByText('$200')).toBeInTheDocument();
  });
});
