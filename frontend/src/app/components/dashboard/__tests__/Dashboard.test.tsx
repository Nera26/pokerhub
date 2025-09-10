import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';

const metricsMock = jest.fn();
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => metricsMock(),
}));

const activityMock = jest.fn();
jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => activityMock(),
}));

const revenueMock = jest.fn();
jest.mock('@/hooks/useRevenueBreakdown', () => ({
  useRevenueBreakdown: (range: string) => revenueMock(range),
}));

jest.mock('@/app/components/dashboard/charts/ActivityChart', () => ({
  __esModule: true,
  default: ({
    labels = [],
    data = [],
  }: {
    labels?: string[];
    data?: number[];
  }) => (
    <div data-testid="activity-chart">
      {labels.join('|')}:{data.join(',')}
    </div>
  ),
}));

jest.mock('@/app/components/dashboard/charts/RevenueDonut', () => ({
  __esModule: true,
  default: ({ streams }: { streams: { pct: number }[] }) => (
    <div data-testid="revenue-donut">{streams.map((s) => s.pct).join(',')}</div>
  ),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('Dashboard metrics', () => {
  beforeEach(() => {
    metricsMock.mockReset();
    activityMock.mockReset();
    revenueMock.mockReset();
    revenueMock.mockReturnValue({ data: [], isLoading: false, error: null });
    activityMock.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
  });

  it('shows loading state', () => {
    metricsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    renderWithClient(<Dashboard />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    metricsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });
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
      },
      isLoading: false,
      error: null,
    });
    activityMock.mockReturnValue({
      data: {
        labels: ['00:00', '04:00'],
        data: [1, 2],
      },
      isLoading: false,
      error: null,
    });
    revenueMock.mockReturnValue({
      data: [
        { label: 'A', pct: 60, value: 6000 },
        { label: 'B', pct: 30, value: 3000 },
        { label: 'C', pct: 10, value: 1000 },
      ],
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
});
