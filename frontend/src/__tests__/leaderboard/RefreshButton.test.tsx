import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { fetchLeaderboard } from '@/lib/api/leaderboard';
import { renderLeaderboardPage, makeLeaderboardEntry } from './testUtils';

jest.mock('@/lib/api/leaderboard', () => ({
  ...jest.requireActual('@/lib/api/leaderboard'),
  fetchLeaderboard: jest.fn(),
  useLeaderboardRanges: () => ({
    data: { ranges: ['daily'] },
    isLoading: false,
    error: null,
  }),
  useLeaderboardModes: () => ({
    data: { modes: ['cash'] },
    isLoading: false,
    error: null,
  }),
}));

describe('Leaderboard refresh', () => {
  it('invalidates leaderboard query on refresh', async () => {
    const mockData = [makeLeaderboardEntry()];

    const mockFetch = fetchLeaderboard as jest.MockedFunction<
      typeof fetchLeaderboard
    >;
    mockFetch.mockResolvedValue(mockData);

    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    renderLeaderboardPage(queryClient);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['leaderboard'] }),
    );
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
