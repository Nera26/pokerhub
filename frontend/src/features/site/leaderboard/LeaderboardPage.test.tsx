import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaderboardPage from '@/features/site/leaderboard';
import { fetchUserProfile } from '@/lib/api/profile';
import { useRouter } from 'next/navigation';

jest.mock('@/app/components/leaderboard/LeaderboardTabs', () => () => <div />);
jest.mock(
  '@/components/leaderboard/LeaderboardBase',
  () =>
    ({ onPlayerClick }: any) => (
      <button onClick={() => onPlayerClick({ playerId: 'alice' })}>
        Alice
      </button>
    ),
);
jest.mock(
  '@/app/components/ui/ToastNotification',
  () =>
    ({ message, type, isOpen }: any) =>
      isOpen ? (
        <div role={type === 'error' ? 'alert' : 'status'}>{message}</div>
      ) : null,
);
jest.mock('@/lib/api/profile');
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/lib/api/leaderboard', () => ({
  useLeaderboardModes: () => ({
    data: { modes: ['cash'] },
    isLoading: false,
    error: null,
  }),
}));

describe('LeaderboardPage', () => {
  function renderWithClient(ui: React.ReactElement) {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to profile on row click', async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (fetchUserProfile as jest.Mock).mockResolvedValue({});

    renderWithClient(<LeaderboardPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Alice' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/profile/alice'));
  });

  it('shows error toast when profile fetch fails', async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (fetchUserProfile as jest.Mock).mockRejectedValue(new Error('fail'));

    renderWithClient(<LeaderboardPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Alice' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load profile',
    );
    expect(push).not.toHaveBeenCalled();
  });
});
