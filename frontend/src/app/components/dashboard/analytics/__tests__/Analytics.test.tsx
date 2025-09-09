import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Analytics from '../Analytics';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import { fetchLogTypeClasses } from '@/lib/api/analytics';

jest.mock('../SearchBar', () => () => <div>SearchBar</div>);
jest.mock('../QuickStats', () => () => <div>QuickStats</div>);
jest.mock('../../charts/ActivityChart', () => () => <div>ActivityChart</div>);
jest.mock('../ErrorChart', () => () => <div>ErrorChart</div>);
jest.mock('../AuditTable', () => () => <div>AuditTable</div>);
jest.mock('../AdvancedFilterModal', () => () => <div>AdvancedFilterModal</div>);
jest.mock('../DetailModal', () => () => <div>DetailModal</div>);

jest.mock('@/hooks/useAuditResource', () => ({
  useAuditLogs: () => ({ data: { logs: [] } }),
  useAuditSummary: () => ({ data: {} }),
}));
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({ data: {}, isLoading: false }),
}));

jest.mock('@/lib/api/leaderboard', () => ({
  rebuildLeaderboard: jest.fn(),
}));
jest.mock('@/lib/api/analytics', () => ({
  fetchLogTypeClasses: jest.fn(),
}));

describe('Analytics', () => {
  beforeEach(() => {
    (fetchLogTypeClasses as jest.Mock).mockResolvedValue({
      Login: '',
      'Table Event': '',
      Broadcast: '',
      Error: '',
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
});
