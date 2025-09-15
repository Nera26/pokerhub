import { mockUseActivity } from '@/test-utils/mockActivity';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Analytics from '../Analytics';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import {
  fetchLogTypeClasses,
  fetchErrorCategories,
  fetchAdminOverview,
} from '@/lib/api/analytics';

const useActivity = mockUseActivity();

jest.mock('../SearchBar', () => () => <div>SearchBar</div>);
jest.mock('../QuickStats', () => () => <div>QuickStats</div>);
jest.mock('../SecurityAlerts', () => () => <div>SecurityAlerts</div>);
jest.mock('../../charts/ActivityChart', () => () => <div>ActivityChart</div>);
jest.mock('../ErrorChart', () => ({ data }: { data?: number[] }) => (
  <div>{data && data.length ? 'ErrorChart' : 'No data'}</div>
));
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
  fetchAdminOverview: jest.fn(),
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
    (fetchAdminOverview as jest.Mock).mockResolvedValue([
      {
        name: 'Total',
        avatar: '',
        lastAction: '',
        total24h: 1,
        login: '',
        loginTitle: '',
      },
      {
        name: 'Errors',
        avatar: '',
        lastAction: '',
        total24h: 0,
        login: '',
        loginTitle: '',
      },
      {
        name: 'Logins',
        avatar: '',
        lastAction: '',
        total24h: 0,
        login: '',
        loginTitle: '',
      },
    ]);
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

  it('renders quick stats when overview loads', async () => {
    renderWithClient(<Analytics />);
    expect(await screen.findByText('QuickStats')).toBeInTheDocument();
  });

  it('shows error when overview fetch fails', async () => {
    (fetchAdminOverview as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    renderWithClient(<Analytics />);
    expect(
      await screen.findByText(/failed to load overview/i),
    ).toBeInTheDocument();
  });
});
