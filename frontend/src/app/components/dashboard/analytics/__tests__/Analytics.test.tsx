import { mockUseActivity } from '@/test-utils/mockActivity';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Analytics from '../Analytics';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import { fetchLogTypeClasses, fetchErrorCategories } from '@/lib/api/analytics';

mockUseActivity();

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
jest.mock('@/hooks/useAuditSummary', () => ({
  useAuditSummary: () => ({ data: {} }),
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
    useAuditLogsMock.mockReturnValue({
      data: { logs: [], total: 0 },
      isLoading: false,
      isError: false,
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

  it('shows empty state when no error categories', async () => {
    (fetchErrorCategories as jest.Mock).mockResolvedValue({
      labels: [],
      counts: [],
    });

    renderWithClient(<Analytics />);
    expect(await screen.findByText(/no data/i)).toBeInTheDocument();
  });
});
