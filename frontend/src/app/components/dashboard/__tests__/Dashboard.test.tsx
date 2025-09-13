import { screen, waitFor } from '@testing-library/react';
import { fetchProfile } from '@/lib/api/profile';
import { mockMetrics, renderDashboard, findUserAvatar } from './utils';

const activityMock = jest.fn();
jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => activityMock(),
}));

const revenueMock = jest.fn();
jest.mock('@/hooks/useRevenueBreakdown', () => ({
  useRevenueBreakdown: (range: string) => revenueMock(range),
}));

const usersMock = jest.fn();
jest.mock('@/hooks/useDashboardUsers', () => ({
  useDashboardUsers: () => usersMock(),
}));

const tablesMock = jest.fn();
jest.mock('@/hooks/useActiveTables', () => ({
  useActiveTables: () => tablesMock(),
}));

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => mockMetrics(),
}));

jest.mock('@/lib/api/profile');

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

describe('Dashboard metrics', () => {
  beforeEach(() => {
    mockMetrics.mockReset();
    activityMock.mockReset();
    revenueMock.mockReset();
    usersMock.mockReset();
    tablesMock.mockReset();
    (fetchProfile as jest.Mock).mockReset();
    revenueMock.mockReturnValue({ data: [], isLoading: false, error: null });
    activityMock.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
    usersMock.mockReturnValue({ data: [], isLoading: false, error: null });
    tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    (fetchProfile as jest.Mock).mockResolvedValue({ avatarUrl: null });
  });

  it('shows loading state', () => {
    mockMetrics.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    renderDashboard();
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });
    renderDashboard();
    expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
  });

  it('renders metrics when loaded', () => {
    mockMetrics.mockReturnValue({
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
    renderDashboard();
    expect(
      screen.getByText(/active users/i).parentElement?.textContent,
    ).toMatch(/5/);

    const revenueLabel = screen.getAllByText(/revenue/i)[0];
    expect(revenueLabel.parentElement?.textContent).toMatch(/\$100/);
  });
});

describe('Dashboard recent users avatar', () => {
  beforeEach(() => {
    mockMetrics.mockReturnValue({ data: {}, isLoading: false, error: null });
    revenueMock.mockReturnValue({ data: [], isLoading: false, error: null });
    activityMock.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
    tablesMock.mockReturnValue({ data: [], isLoading: false, error: null });
    usersMock.mockReturnValue({
      data: [{ id: '1', username: 'bob', balance: 0 }],
      isLoading: false,
      error: null,
    });
    (fetchProfile as jest.Mock).mockResolvedValue({
      avatarUrl: '/profile.png',
    });
  });

  it('falls back to profile avatar when user lacks avatarKey', async () => {
    renderDashboard();
    const img = await findUserAvatar('bob');
    await waitFor(() =>
      expect(img.getAttribute('src')).toContain('%2Fprofile.png'),
    );
  });
});
