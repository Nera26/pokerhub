import { screen } from '@testing-library/react';
import { renderLeaderboardPage } from './testUtils';

jest.mock('@/features/leaderboard', () => ({
  __esModule: true,
  LeaderboardBase: () => <div />,
  LeaderboardTabs: () => <div />,
}));

jest.mock('@/lib/api/leaderboard', () => ({
  useLeaderboardModes: jest.fn(),
}));

const useLeaderboardModes = require('@/lib/api/leaderboard')
  .useLeaderboardModes as jest.Mock;

describe('LeaderboardPage mode filter', () => {
  beforeEach(() => {
    useLeaderboardModes.mockReset();
  });

  it('shows loading indicator while modes load', () => {
    useLeaderboardModes.mockReturnValue({
      isLoading: true,
      data: undefined,
      error: null,
    });
    renderLeaderboardPage();
    expect(screen.getByText('Loading modes...')).toBeInTheDocument();
  });

  it('renders error state when modes fail to load', () => {
    useLeaderboardModes.mockReturnValue({
      isLoading: false,
      data: undefined,
      error: new Error('fail'),
    });
    renderLeaderboardPage();
    expect(screen.getByText('Error loading modes')).toBeInTheDocument();
  });

  it('disables filters when no modes are available', () => {
    useLeaderboardModes.mockReturnValue({
      isLoading: false,
      data: { modes: [] },
      error: null,
    });
    renderLeaderboardPage();
    expect(screen.getByText('No modes available')).toBeInTheDocument();
  });
});
