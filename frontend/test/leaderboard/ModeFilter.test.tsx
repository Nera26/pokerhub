import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaderboardPage from '@/features/site/leaderboard';

jest.mock('@fortawesome/react-fontawesome', () => ({
  __esModule: true,
  FontAwesomeIcon: () => <span />,
}));

jest.mock('@/app/components/leaderboard/LeaderboardTabs', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/components/leaderboard/LeaderboardBase', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('@/app/components/ui/ToastNotification', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/api/profile');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/api/leaderboard', () => ({
  useLeaderboardModes: jest.fn(),
}));

const useLeaderboardModes = require('@/lib/api/leaderboard')
  .useLeaderboardModes as jest.Mock;

describe('LeaderboardPage mode filter', () => {
  function renderPage() {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>
        <LeaderboardPage />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    useLeaderboardModes.mockReset();
  });

  it('shows loading indicator while modes load', () => {
    useLeaderboardModes.mockReturnValue({
      isLoading: true,
      data: undefined,
      error: null,
    });
    renderPage();
    expect(screen.getByText('Loading modes...')).toBeInTheDocument();
  });

  it('renders error state when modes fail to load', () => {
    useLeaderboardModes.mockReturnValue({
      isLoading: false,
      data: undefined,
      error: new Error('fail'),
    });
    renderPage();
    expect(screen.getByText('Error loading modes')).toBeInTheDocument();
  });

  it('disables filters when no modes are available', () => {
    useLeaderboardModes.mockReturnValue({
      isLoading: false,
      data: { modes: [] },
      error: null,
    });
    renderPage();
    expect(screen.getByText('No modes available')).toBeInTheDocument();
  });
});
