import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavigationLinks from '@/app/components/common/header/NavigationLinks';
import { fetchNavItems } from '@/lib/api/nav';
import { useAuth } from '@/context/AuthContext';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';

jest.mock('@/lib/api/nav', () => ({ fetchNavItems: jest.fn() }));
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('next/link', () => {
  return ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const mockFetchNavItems = fetchNavItems as jest.MockedFunction<
  typeof fetchNavItems
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('NavigationLinks', () => {
  function renderLinks(balance: string) {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <NavigationLinks balance={balance} />
      </QueryClientProvider>,
    );
  }

  it('renders links from API response', async () => {
    mockFetchNavItems.mockResolvedValue([
      { flag: 'profile', href: '/user', label: 'Profile', icon: faUser },
      { flag: 'wallet', href: '/wallet', label: 'Wallet', icon: faWallet },
      {
        flag: 'promotions',
        href: '/promotions',
        label: 'Promotions',
        icon: faTags,
      },
      {
        flag: 'leaderboard',
        href: '/leaderboard',
        label: 'Leaderboard',
        icon: faTrophy,
      },
    ]);
    mockUseAuth.mockReturnValue({ avatarUrl: '/avatar.png' });

    renderLinks('$100.00');

    expect(
      await screen.findByRole('link', { name: /Profile/ }),
    ).toBeInTheDocument();
    const avatar = screen.getByRole('img', { name: 'User Avatar' });
    expect(avatar.getAttribute('src')).toContain('%2Favatar.png');

    const wallet = await screen.findByRole('link', { name: /Wallet/ });
    expect(wallet).toHaveTextContent('$100.00');

    expect(
      screen.getByRole('link', { name: /Promotions/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Leaderboard/ }),
    ).toBeInTheDocument();
  });
});
