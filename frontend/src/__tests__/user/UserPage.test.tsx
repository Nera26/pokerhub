import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '@/app/user/page';
import { fetchProfile, fetchStats, updateProfile } from '@/lib/api/profile';
import { fetchTiers } from '@/lib/api/tiers';
import { fetchHistoryTabs } from '@/lib/api/historyTabs';
import {
  fetchGameHistory,
  fetchTournamentHistory,
  fetchTransactions,
} from '@/lib/api/history';
import useLogout from '@/hooks/useLogout';

jest.mock('@/lib/api/profile');
jest.mock('@/lib/api/tiers');
jest.mock('@/lib/api/historyTabs');
jest.mock('@/lib/api/history');
jest.mock('@/hooks/useLogout');

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>,
  );
}

describe('UserPage', () => {
  const profile = {
    username: 'Alice',
    email: 'alice@example.com',
    bank: '1234',
    bio: 'Hi',
    avatarUrl: '/avatar.png',
    location: 'Earth',
    joined: '2024-01-01',
    experience: 1000,
    balance: 2000,
  };
  const stats = {
    handsPlayed: 10,
    winRate: 50,
    tournamentsPlayed: 4,
    topThreeRate: 25,
  };
  const tiers = [
    { name: 'Bronze', min: 0, max: 999 },
    { name: 'Silver', min: 1000, max: 1999 },
    { name: 'Gold', min: 2000, max: null },
  ];
  const tabs = [
    { key: 'game-history', label: 'Games' },
    { key: 'tournament-history', label: 'Tournaments' },
    { key: 'transaction-history', label: 'Transactions' },
  ];

  beforeEach(() => {
    (fetchProfile as jest.Mock).mockResolvedValue(profile);
    (fetchStats as jest.Mock).mockResolvedValue(stats);
    (fetchTiers as jest.Mock).mockResolvedValue(tiers);
    (fetchHistoryTabs as jest.Mock).mockResolvedValue(tabs);
    (fetchGameHistory as jest.Mock).mockResolvedValue([]);
    (fetchTournamentHistory as jest.Mock).mockResolvedValue([]);
    (fetchTransactions as jest.Mock).mockResolvedValue([]);
    (updateProfile as jest.Mock).mockResolvedValue(profile);
    (useLogout as jest.Mock).mockReturnValue({
      mutate: jest.fn((_v, opts) => opts?.onSuccess?.()),
      isPending: false,
    });
  });

  it('renders profile information', async () => {
    renderPage();
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Game Statistics')).toBeInTheDocument();
  });

  it('saves profile edits', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alice');
    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('logs out via modal', async () => {
    const user = userEvent.setup();
    const logoutMock = jest.fn((_v, opts) => opts?.onSuccess?.());
    (useLogout as jest.Mock).mockReturnValue({
      mutate: logoutMock,
      isPending: false,
    });
    renderPage();
    await screen.findByText('Alice');
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    await user.click(screen.getAllByRole('button', { name: 'Logout' })[1]);
    expect(logoutMock).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
});
