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
import { useGameTypes } from '@/hooks/useGameTypes';

jest.mock('@/lib/api/profile');
jest.mock('@/lib/api/tiers');
jest.mock('@/lib/api/historyTabs');
jest.mock('@/lib/api/history');
jest.mock('@/hooks/useLogout');
jest.mock('@/hooks/useGameTypes');

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

  const mockUseGameTypes = useGameTypes as jest.MockedFunction<
    typeof useGameTypes
  >;

  beforeEach(() => {
    (fetchProfile as jest.Mock).mockResolvedValue(profile);
    (fetchStats as jest.Mock).mockResolvedValue(stats);
    (fetchTiers as jest.Mock).mockResolvedValue(tiers);
    (fetchHistoryTabs as jest.Mock).mockResolvedValue(tabs);
    (fetchGameHistory as jest.Mock).mockResolvedValue({ items: [] });
    (fetchTournamentHistory as jest.Mock).mockResolvedValue({ items: [] });
    (fetchTransactions as jest.Mock).mockResolvedValue({ items: [] });
    (updateProfile as jest.Mock).mockResolvedValue(profile);
    (useLogout as jest.Mock).mockReturnValue({
      mutate: jest.fn((_v, opts) => opts?.onSuccess?.()),
      isPending: false,
    });
    mockUseGameTypes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
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

  it('applies filters to history list', async () => {
    const user = userEvent.setup();
    const data = [
      {
        id: '1',
        type: "Texas Hold'em",
        stakes: '$1/$2',
        buyin: '$100',
        date: '2023-01-01',
        profit: true,
        amount: 50,
        currency: 'USD',
      },
      {
        id: '2',
        type: 'Omaha',
        stakes: '$1/$2',
        buyin: '$100',
        date: '2023-01-02',
        profit: false,
        amount: -20,
        currency: 'USD',
      },
    ];
    (fetchGameHistory as jest.Mock)
      .mockResolvedValueOnce({ items: data })
      .mockResolvedValueOnce({ items: [data[0]!] });
    renderPage();
    expect(await screen.findByText(/Table #1/)).toBeInTheDocument();
    expect(screen.getByText(/Table #2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.selectOptions(screen.getAllByRole('combobox')[1], 'win');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(fetchGameHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ profitLoss: 'win' }),
        expect.any(Object),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText(/Table #2/)).not.toBeInTheDocument(),
    );
    expect(screen.getByText(/Table #1/)).toBeInTheDocument();
  });
});
