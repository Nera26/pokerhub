import { mockUseActivity } from '@/test-utils/mockActivity';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Analytics from '../Analytics';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import { fetchLogTypeClasses, fetchErrorCategories } from '@/lib/api/analytics';

const useActivity = mockUseActivity();
const useAuditSummaryMock = jest.fn();
const useRevenueBreakdownMock = jest.fn();

jest.mock('@/hooks/useAuditSummary', () => ({
  useAuditSummary: (...args: any[]) => useAuditSummaryMock(...args),
}));

jest.mock('@/hooks/useRevenueBreakdown', () => ({
  useRevenueBreakdown: (...args: any[]) => useRevenueBreakdownMock(...args),
}));

jest.mock(
  '@/app/components/dashboard/common/SearchInput',
  () => (props: any) => <input {...props} />,
);

jest.mock('../SearchBar', () => () => <div>SearchBar</div>);
jest.mock('../QuickStats', () => ({
  __esModule: true,
  default: ({
    total,
    errors,
    logins,
  }: {
    total: number;
    errors: number;
    logins: number;
  }) => <div>{`QuickStats ${total} ${errors} ${logins}`}</div>,
}));
jest.mock('../SecurityAlerts', () => () => <div>SecurityAlerts</div>);
jest.mock('../../charts/ActivityChart', () => () => <div>ActivityChart</div>);
jest.mock('../ErrorChart', () => ({ data }: { data?: number[] }) => (
  <div>{data && data.length ? 'ErrorChart' : 'No data'}</div>
));
jest.mock('../../charts/RevenueDonut', () => ({
  __esModule: true,
  default: ({ streams }: { streams: { label: string }[] }) => (
    <div>{`RevenueDonut: ${streams.map((s) => s.label).join(', ')}`}</div>
  ),
}));
jest.mock('../AuditTable', () => () => <div>AuditTable</div>);
jest.mock('../AdvancedFilterModal', () => () => <div>AdvancedFilterModal</div>);
jest.mock('../DetailModal', () => () => <div>DetailModal</div>);

const useAuditLogsMock = jest.fn(() => ({
  data: { logs: [], total: 0 },
  isLoading: false,
  isError: false,
}));
jest.mock('@/hooks/useAuditLogs', () => ({
  useAuditLogs: (...args: any[]) => useAuditLogsMock(...args),
}));

jest.mock('@/lib/api/leaderboard', () => ({
  rebuildLeaderboard: jest.fn(),
}));
jest.mock('@/lib/api/analytics', () => ({
  fetchLogTypeClasses: jest.fn(),
  fetchErrorCategories: jest.fn(),
}));

describe('Analytics', () => {
  beforeEach(() => {
    (fetchLogTypeClasses as jest.Mock).mockResolvedValue({
      Login: '',
      'Table Event': '',
      Broadcast: '',
      Error: '',
    });
    (fetchErrorCategories as jest.Mock).mockResolvedValue({
      labels: ['Payment'],
      counts: [1],
    });
    useAuditSummaryMock.mockReturnValue({
      data: { total: 1, errors: 0, logins: 0 },
      isLoading: false,
      isError: false,
    });
    useAuditLogsMock.mockReturnValue({
      data: { logs: [], total: 0 },
      isLoading: false,
      isError: false,
    });
    useActivity.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
    useRevenueBreakdownMock.mockReturnValue({
      data: [
        { label: 'Cash Games', pct: 55 },
        { label: 'Tournaments', pct: 30 },
      ],
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  it('triggers leaderboard rebuild mutation', async () => {
    (rebuildLeaderboard as jest.Mock).mockResolvedValue({ status: 'ok' });

    renderWithClient(<Analytics />);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', {
      name: /rebuild leaderboard/i,
    });
    await user.click(button);

    await waitFor(() => {
      expect(rebuildLeaderboard).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/leaderboard rebuild started/i),
    ).toBeInTheDocument();
  });

  it('shows empty state when no error categories', async () => {
    (fetchErrorCategories as jest.Mock).mockResolvedValue({
      labels: [],
      counts: [],
    });

    renderWithClient(<Analytics />);
    expect(await screen.findByText(/no data/i)).toBeInTheDocument();
  });

  it('renders quick stats with summary totals', async () => {
    renderWithClient(<Analytics />);
    expect(await screen.findByText(/QuickStats 1 0 0/)).toBeInTheDocument();
  });

  it('shows error when summary fetch fails', async () => {
    useAuditSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderWithClient(<Analytics />);
    expect(
      await screen.findByText(/failed to load overview/i),
    ).toBeInTheDocument();
  });

  it('renders revenue donut when revenue data is available', async () => {
    renderWithClient(<Analytics />);

    expect(
      await screen.findByText(/RevenueDonut: Cash Games, Tournaments/i),
    ).toBeInTheDocument();
  });
});
