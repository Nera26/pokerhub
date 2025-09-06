import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '@/features/site/profile';
import { fetchProfile } from '@/lib/api/profile';

jest.mock('@/lib/api/profile');
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

  it('renders profile data on success', async () => {
    (fetchProfile as jest.Mock).mockResolvedValue({
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      bank: '•••• 1234',
      location: 'United States',
      joined: '2023-01-15T00:00:00.000Z',
      bio: 'Texas grinder',
      experience: 1234,
      balance: 1250,
    });
    render(<ProfilePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'PlayerOne23' }),
    ).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    (fetchProfile as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<ProfilePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    (fetchProfile as jest.Mock).mockRejectedValue(new Error('fail'));
    render(<ProfilePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(
      await screen.findByText('Error loading profile'),
    ).toBeInTheDocument();
  });
});
