import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Analytics from '../Analytics';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import { fetchLogTypeClasses, fetchErrorCategories } from '@/lib/api/analytics';

jest.mock('../SearchBar', () => () => <div>SearchBar</div>);
jest.mock('../QuickStats', () => () => <div>QuickStats</div>);
jest.mock('../../charts/ActivityChart', () => () => <div>ActivityChart</div>);
jest.mock('../ErrorChart', () => ({ data }: { data?: number[] }) => (
  <div>{data && data.length ? 'ErrorChart' : 'No data'}</div>
));
jest.mock('../AuditTable', () => () => <div>AuditTable</div>);
jest.mock('../AdvancedFilterModal', () => () => <div>AdvancedFilterModal</div>);
jest.mock('../DetailModal', () => () => <div>DetailModal</div>);

jest.mock('@/hooks/useAuditLogs', () => ({
  useAuditLogs: () => ({ data: { logs: [] } }),
}));
jest.mock('@/hooks/useAuditSummary', () => ({
  useAuditSummary: () => ({ data: {} }),
}));
jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => ({
    data: { labels: [], data: [] },
    isLoading: false,
    error: null,
  }),
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
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient();
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

  it('shows loading state for error categories', () => {
    (fetchErrorCategories as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithClient(<Analytics />);
    expect(screen.getByText(/loading error categories/i)).toBeInTheDocument();
  });

  it('shows empty state when no error categories', async () => {
    (fetchErrorCategories as jest.Mock).mockResolvedValue({
      labels: [],
      counts: [],
    });

    renderWithClient(<Analytics />);
    expect(await screen.findByText(/no data/i)).toBeInTheDocument();
  });

  it('shows error state when error categories fail', async () => {
    (fetchErrorCategories as jest.Mock).mockRejectedValue(new Error('fail'));

    renderWithClient(<Analytics />);
    expect(
      await screen.findByText(/failed to load error categories/i),
    ).toBeInTheDocument();
  });
});
