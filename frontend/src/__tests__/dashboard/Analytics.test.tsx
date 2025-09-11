import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import Analytics from '@/app/components/dashboard/analytics/Analytics';
import { AuditLogEntrySchema } from '@shared/schemas/analytics';

jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: jest.fn(() => ({ destroy: jest.fn() })),
}));

jest.mock('@/hooks/useAuditLogs', () => ({
  useAuditLogs: () => ({
    data: {
      logs: [
        {
          id: 1,
          timestamp: '2024-01-01T00:00:00Z',
          type: 'Login',
          description: 'User successfully logged in',
          user: 'alice',
          ip: '1.1.1.1',
        },
        {
          id: 2,
          timestamp: '2024-01-01T01:00:00Z',
          type: 'Error',
          description: 'Database connection timeout',
          user: 'service',
          ip: '2.2.2.2',
        },
        {
          id: 3,
          timestamp: '2024-01-01T02:00:00Z',
          type: 'Error',
          description: 'Failed payment processing',
          user: 'bob',
          ip: '3.3.3.3',
        },
      ],
      total: 3,
    },
    isLoading: false,
    isError: false,
  }),
}));
jest.mock('@/hooks/useAuditSummary', () => ({
  useAuditSummary: () => ({ data: { total: 3, errors: 2, logins: 1 } }),
}));

jest.mock('@/lib/api/leaderboard', () => ({
  rebuildLeaderboard: jest.fn(() => Promise.resolve()),
}));
const activityMock = jest.fn();
jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => activityMock(),
}));
jest.mock('@/lib/api/analytics', () => ({
  fetchLogTypeClasses: jest.fn().mockResolvedValue({
    Login: '',
    'Table Event': '',
    Broadcast: '',
    Error: '',
  }),
  fetchErrorCategories: jest.fn().mockResolvedValue({
    labels: ['Payment'],
    counts: [1, 2, 3, 4],
  }),
}));
jest.mock('@/lib/exportCsv', () => ({ exportCsv: jest.fn() }));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  activityMock.mockReturnValue({
    data: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      data: [1, 2, 3, 4, 5, 6, 7],
    },
    isLoading: false,
    error: null,
  });
});

describe('dashboard metrics charts', () => {
  it('shows loading state', () => {
    activityMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    const { fetchErrorCategories } = require('@/lib/api/analytics');
    (fetchErrorCategories as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithClient(<Analytics />);
    expect(screen.getByText(/loading activity/i)).toBeInTheDocument();
    expect(screen.getByText(/loading error categories/i)).toBeInTheDocument();
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('shows empty state when no data', () => {
    activityMock.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
    const { fetchErrorCategories } = require('@/lib/api/analytics');
    (fetchErrorCategories as jest.Mock).mockResolvedValue({
      labels: [],
      counts: [],
    });
    renderWithClient(<Analytics />);
    expect(screen.getAllByText(/no data/i)).toHaveLength(2);
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('renders charts when data present', async () => {
    activityMock.mockReturnValue({
      data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        data: [1, 2, 3, 4, 5, 6, 7],
      },
      isLoading: false,
      error: null,
    });
    const { fetchErrorCategories } = require('@/lib/api/analytics');
    (fetchErrorCategories as jest.Mock).mockResolvedValue({
      labels: ['Payment'],
      counts: [1, 2, 3, 4],
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

describe('CSV export', () => {
  it('uses schema keys for header', async () => {
    renderWithClient(<Analytics />);
    const user = userEvent.setup();
    const exportBtn = await screen.findByRole('button', { name: /export/i });
    await user.click(exportBtn);
    const { exportCsv } = require('@/lib/exportCsv');
    const header = (exportCsv as jest.Mock).mock.calls[0][1];
    expect(header).toEqual(Object.keys(AuditLogEntrySchema.shape));
  });
});
