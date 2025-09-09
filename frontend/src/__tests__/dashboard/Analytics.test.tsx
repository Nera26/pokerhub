import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import Analytics from '@/app/components/dashboard/analytics/Analytics';
import { AUDIT_LOG_TYPES } from '@shared/types';

jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn() })),
}));

jest.mock('@/hooks/useAuditResource', () => ({
  useAuditLogs: () => ({
    data: {
      logs: [
        {
          id: 1,
          timestamp: '2024-01-01T00:00:00Z',
          type: AUDIT_LOG_TYPES[0],
          description: 'User successfully logged in',
          user: 'alice',
          ip: '1.1.1.1',
        },
        {
          id: 2,
          timestamp: '2024-01-01T01:00:00Z',
          type: AUDIT_LOG_TYPES[3],
          description: 'Database connection timeout',
          user: 'service',
          ip: '2.2.2.2',
        },
        {
          id: 3,
          timestamp: '2024-01-01T02:00:00Z',
          type: AUDIT_LOG_TYPES[3],
          description: 'Failed payment processing',
          user: 'bob',
          ip: '3.3.3.3',
        },
      ],
    },
  }),
  useAuditSummary: () => ({ data: { total: 3, errors: 2, logins: 1 } }),
}));

jest.mock('@/lib/api/leaderboard', () => ({
  rebuildLeaderboard: jest.fn(() => Promise.resolve()),
}));

const dashboardMetricsMock = jest.fn();
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => dashboardMetricsMock(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  dashboardMetricsMock.mockReturnValue({
    data: {
      online: 0,
      revenue: 0,
      activity: [1, 2, 3, 4, 5, 6, 7],
      errors: [1, 1, 1, 1],
    },
    isLoading: false,
  });
});

describe('Analytics filtering', () => {
  it('filters logs by search text', async () => {
    renderWithClient(<Analytics />);
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(
      /search by description, user, or event type/i,
    );

    expect(
      screen.getByText(/user successfully logged in/i),
    ).toBeInTheDocument();

    await user.type(searchInput, 'timeout');

    expect(
      await screen.findByText(/database connection timeout/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/user successfully logged in/i),
    ).not.toBeInTheDocument();
  });

  it('filters logs by type', async () => {
    renderWithClient(<Analytics />);
    const user = userEvent.setup();
    const typeSelect = screen.getByRole('combobox');

    await user.selectOptions(typeSelect, AUDIT_LOG_TYPES[3]);

    expect(screen.getByText(/failed payment processing/i)).toBeInTheDocument();
    expect(
      screen.getByText(/database connection timeout/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/user successfully logged in/i),
    ).not.toBeInTheDocument();
  });
});

describe('dashboard metrics charts', () => {
  it('shows loading state', () => {
    dashboardMetricsMock.mockReturnValue({ data: undefined, isLoading: true });
    renderWithClient(<Analytics />);
    expect(screen.getAllByText(/loading metrics/i)).toHaveLength(2);
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('shows empty state when no data', () => {
    dashboardMetricsMock.mockReturnValue({
      data: { online: 0, revenue: 0, activity: [], errors: [] },
      isLoading: false,
    });
    renderWithClient(<Analytics />);
    expect(screen.getAllByText(/no data/i)).toHaveLength(2);
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('renders charts when data present', async () => {
    dashboardMetricsMock.mockReturnValue({
      data: {
        online: 0,
        revenue: 0,
        activity: [1, 2, 3, 4, 5, 6, 7],
        errors: [1, 2, 3, 4],
      },
      isLoading: false,
    });
    renderWithClient(<Analytics />);
    expect(document.querySelectorAll('canvas')).toHaveLength(2);
    await screen.findByRole('img', { name: /activity/i });
  });
});

describe('leaderboard rebuild toast', () => {
  it('shows toast when rebuild starts', async () => {
    renderWithClient(<Analytics />);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /rebuild leaderboard/i }),
    );
    expect(
      await screen.findByText(/leaderboard rebuild started/i),
    ).toBeInTheDocument();
  });
});
