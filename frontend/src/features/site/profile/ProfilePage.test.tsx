import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '@/features/site/profile';
import { fetchProfile } from '@/lib/api/profile';
import { fetchTiers } from '@/lib/api/tiers';

const mockTiers = [
  { name: 'Bronze', min: 0, max: 999 },
  { name: 'Silver', min: 1000, max: 4999 },
];

jest.mock('@/lib/api/profile');
jest.mock('@/lib/api/tiers');
jest.mock('@/app/components/user/GameStatistics', () => () => <div />);
jest.mock('@/app/components/user/HistoryTabs', () => () => <div />);
jest.mock('@/app/components/user/HistoryList', () => () => <div />);
jest.mock('@/app/components/user/FilterDropdown', () => () => <div />);
jest.mock('@/app/components/user/ReplayModal', () => () => null);
jest.mock('@/app/components/user/BracketModal', () => () => null);
jest.mock('@/app/components/user/LogoutModal', () => () => null);
jest.mock('@/app/components/user/EditProfileModal', () => () => null);
jest.mock('@/app/components/ui/ToastNotification', () => () => null);

describe('ProfilePage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderWithClient(ui: React.ReactElement) {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
  }

  it('renders profile data on success', async () => {
    (fetchProfile as jest.Mock).mockResolvedValue({
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      bank: '\u2022\u2022\u2022\u2022 1234',
      location: 'United States',
      joined: '2023-01-15T00:00:00.000Z',
      bio: 'Texas grinder',
      experience: 1234,
      balance: 1250,
    });
    (fetchTiers as jest.Mock).mockResolvedValue(mockTiers);
    renderWithClient(<ProfilePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'PlayerOne23' }),
    ).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    (fetchProfile as jest.Mock).mockReturnValue(new Promise(() => {}));
    (fetchTiers as jest.Mock).mockResolvedValue(mockTiers);
    renderWithClient(<ProfilePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    (fetchProfile as jest.Mock).mockRejectedValue(new Error('fail'));
    (fetchTiers as jest.Mock).mockResolvedValue(mockTiers);
    renderWithClient(<ProfilePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      await screen.findByText('Error loading profile'),
    ).toBeInTheDocument();
  });
});
