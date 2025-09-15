import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import LeaderboardBase from '@/features/leaderboard/LeaderboardBase';
import LeaderboardTabs from '@/features/leaderboard/LeaderboardTabs';
import { fetchLeaderboard, useLeaderboardRanges } from '@/lib/api/leaderboard';
import { leaderboard as daily } from './fixtures/leaderboard';

const weekly = [{ ...daily[0], playerId: 'carol' }];

jest.mock('@/lib/api/leaderboard', () => {
  const actual = jest.requireActual('@/lib/api/leaderboard');
  return {
    ...actual,
    fetchLeaderboard: jest.fn(),
    useLeaderboardRanges: jest.fn(),
  };
});

describe('LeaderboardTabs', () => {
  let client: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    wrapper = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    (fetchLeaderboard as jest.Mock).mockReset();
    (useLeaderboardRanges as jest.Mock).mockReturnValue({
      data: { ranges: ['daily', 'weekly'] },
      isLoading: false,
      error: null,
    });
  });

  it('refetches leaderboard when tab changes', async () => {
    (fetchLeaderboard as jest.Mock)
      .mockResolvedValueOnce(daily)
      .mockResolvedValueOnce(weekly);

    const user = userEvent.setup();
    render(<LeaderboardBase />, { wrapper });

    await screen.findByText('alice');
    await user.click(screen.getByRole('tab', { name: /weekly/i }));
    await screen.findByText('carol');

    expect(fetchLeaderboard).toHaveBeenLastCalledWith({
      signal: expect.any(AbortSignal),
      range: 'weekly',
    });
  });

  it('supports keyboard navigation', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<LeaderboardTabs selected="daily" onChange={onChange} />, {
      wrapper,
    });

    const dailyTab = await screen.findByRole('tab', { name: /daily/i });
    dailyTab.focus();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith('weekly');
    expect(screen.getByRole('tab', { name: /weekly/i })).toHaveFocus();
  });
});
