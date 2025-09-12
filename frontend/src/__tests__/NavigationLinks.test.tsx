import { render, screen } from '@testing-library/react';
import NavigationLinks from '@/app/components/common/header/NavigationLinks';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

jest.mock('@/hooks/useFeatureFlags');

const mockUseFeatureFlags = useFeatureFlags as jest.MockedFunction<
  typeof useFeatureFlags
>;

describe('NavigationLinks', () => {
  const cases = [
    { balance: '$100.00', avatarUrl: '/avatar1.png' },
    { balance: '$250.50', avatarUrl: '/avatar2.png' },
  ];

  beforeEach(() => {
    mockUseFeatureFlags.mockReturnValue({
      data: { promotions: true, leaderboard: true },
      error: undefined,
      isLoading: false,
    });
  });

  test.each(cases)(
    'renders links and avatar correctly for %o',
    ({ balance, avatarUrl }) => {
      render(
        // avatarUrl is passed but may or may not be used depending on implementation
        <NavigationLinks balance={balance} avatarUrl={avatarUrl} />,
      );

      const profileLink = screen.getByRole('link', { name: /Profile/i });
      expect(profileLink).toHaveAttribute('href', '/user');

      const walletLink = screen.getByRole('link', { name: 'Wallet' });
      expect(walletLink).toHaveAttribute('href', '/wallet');
      expect(walletLink).toHaveAttribute('aria-label', 'Wallet');
      expect(walletLink).toHaveTextContent(balance);

      const promotionsLink = screen.getByRole('link', { name: /Promotions/i });
      expect(promotionsLink).toHaveAttribute('href', '/promotions');

      const leaderboardLink = screen.getByRole('link', {
        name: /Leaderboard/i,
      });
      expect(leaderboardLink).toHaveAttribute('href', '/leaderboard');

      const avatar = screen.getByAltText('User Avatar');
      expect(avatar).toHaveClass(
        'w-8 h-8 rounded-full mr-2 border-2 border-accent-yellow',
      );
    },
  );

  it('uses provided avatarUrl when set', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: { promotions: false, leaderboard: false },
      error: undefined,
      isLoading: false,
    });
    const avatar = 'https://example.com/avatar.png';
    render(<NavigationLinks balance="$0" avatarUrl={avatar} />);
    const img = screen.getByRole('img', { name: 'User Avatar' });
    expect(img.getAttribute('src')).toContain(encodeURIComponent(avatar));
  });

  it('falls back to default avatar when none provided', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: { promotions: false, leaderboard: false },
      error: undefined,
      isLoading: false,
    });
    render(<NavigationLinks balance="$0" />);
    const img = screen.getByRole('img', { name: 'User Avatar' });
    expect(img.getAttribute('src')).toBe(
      'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    );
  });

  it('hides Promotions link when flag disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: { promotions: false, leaderboard: true },
      error: undefined,
      isLoading: false,
    });
    render(<NavigationLinks balance="$0" />);
    expect(
      screen.queryByRole('link', { name: /Promotions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Leaderboard/i }),
    ).toBeInTheDocument();
  });

  it('hides Leaderboard link when flag disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: { promotions: true, leaderboard: false },
      error: undefined,
      isLoading: false,
    });
    render(<NavigationLinks balance="$0" />);
    expect(
      screen.queryByRole('link', { name: /Leaderboard/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Promotions/i }),
    ).toBeInTheDocument();
  });
});
