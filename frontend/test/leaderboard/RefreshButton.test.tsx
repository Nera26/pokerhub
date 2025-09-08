import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaderboardPage from '@/features/site/leaderboard';
import { fetchLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardEntry } from '@shared/types';

jest.mock('@fortawesome/react-fontawesome', () => ({
  __esModule: true,
  FontAwesomeIcon: () => <span />, 
}));

jest.mock('@/app/components/leaderboard/LeaderboardTabs', () => ({
  __esModule: true,
  default: () => <div />, 
}));

jest.mock('@/app/components/ui/ToastNotification', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/api/leaderboard', () => ({
  ...jest.requireActual('@/lib/api/leaderboard'),
  fetchLeaderboard: jest.fn(),
  useLeaderboardRanges: () => ({
    data: { ranges: ['daily'] },
    isLoading: false,
    error: null,
  }),
}));

describe('Leaderboard refresh', () => {
  it('invalidates leaderboard query on refresh', async () => {
    const mockData: LeaderboardEntry[] = [
      {
        playerId: 'p1',
        rank: 1,
        points: 0,
        rd: 0,
        volatility: 0,
        net: 100,
        bb100: 10,
        hours: 1,
        roi: 0,
        finishes: {},
      },
    ];

    const mockFetch = fetchLeaderboard as jest.MockedFunction<typeof fetchLeaderboard>;
    mockFetch.mockResolvedValue(mockData);

    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    render(
      <QueryClientProvider client={queryClient}>
        <LeaderboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['leaderboard'] }),
    );
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});

