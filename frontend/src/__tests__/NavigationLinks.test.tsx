import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavigationLinks from '@/app/components/common/header/NavigationLinks';
import BottomNav from '@/app/components/common/BottomNav';
import { fetchNavItems } from '@/lib/api/nav';
import { faHome } from '@fortawesome/free-solid-svg-icons/faHome';
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';

const mockUsePathname = jest.fn();
const mockUseAuth = jest.fn();
const mockUseNotifications = jest.fn();
const mockFetchNavItems = fetchNavItems as jest.MockedFunction<
  typeof fetchNavItems
>;

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => {
  return ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock(
  'next/image',
  () => (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
);

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/hooks/notifications', () => ({
  useNotifications: () => mockUseNotifications(),
}));

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn(),
}));

const baseNavItems = [
  { flag: 'lobby', href: '/', label: 'Lobby', icon: faHome },
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
  {
    flag: 'notifications',
    href: '/notifications',
    label: 'Alerts',
    icon: faBell,
  },
  { flag: 'profile', href: '/user', label: 'Profile' },
];

describe('Navigation Links', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUseAuth.mockReset();
    mockUseNotifications.mockReset();
    mockFetchNavItems.mockReset();
  });

  function renderLinks(balance: string) {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <NavigationLinks balance={balance} />
      </QueryClientProvider>,
    );
  }

  it('renders links from API response', async () => {
    mockFetchNavItems.mockResolvedValue(baseNavItems);
    mockUseAuth.mockReturnValue({ avatarUrl: '/avatar.png' });

    renderLinks('$100.00');

    expect(
      await screen.findByRole('link', { name: /Profile/ }),
    ).toBeInTheDocument();
    const avatar = screen.getByRole('img', { name: 'User Avatar' });
    expect(avatar.getAttribute('src')).toContain('/avatar.png');

    const wallet = await screen.findByRole('link', { name: /Wallet/ });
    expect(wallet).toHaveTextContent('$100.00');

    expect(
      screen.getByRole('link', { name: /Promotions/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Leaderboard/ }),
    ).toBeInTheDocument();
  });

  it('renders nothing while loading', () => {
    mockFetchNavItems.mockReturnValue(new Promise(() => {}));
    mockUseAuth.mockReturnValue({ avatarUrl: '/avatar.png' });

    renderLinks('$100.00');

    expect(
      screen.queryByRole('link', { name: /Profile/ }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing on error', async () => {
    mockFetchNavItems.mockRejectedValue(new Error('fail'));
    mockUseAuth.mockReturnValue({ avatarUrl: '/avatar.png' });

    renderLinks('$100.00');

    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: /Profile/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it('renders newly created nav items', async () => {
    mockFetchNavItems.mockResolvedValue([
      ...baseNavItems,
      { flag: 'about', href: '/about', label: 'About' },
    ]);
    mockUseAuth.mockReturnValue({ avatarUrl: '/avatar.png' });
    renderLinks('$0.00');
    expect(
      await screen.findByRole('link', { name: /About/ }),
    ).toBeInTheDocument();
  });
});

describe('BottomNav', () => {
  beforeEach(() => {
    mockFetchNavItems.mockResolvedValue(baseNavItems);
  });

  function renderNav() {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <BottomNav />
      </QueryClientProvider>,
    );
  }

  it('activates item when pathname starts with href', async () => {
    mockUsePathname.mockReturnValue('/wallet/deposit');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 2 },
      isLoading: false,
      error: null,
    });
    renderNav();
    const wallet = await screen.findByRole('link', { name: 'Wallet' });
    expect(wallet.className).toContain('text-accent-yellow');
  });

  it('only marks lobby active on root path', async () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 0 },
      isLoading: false,
      error: null,
    });
    renderNav();
    const lobby = await screen.findByRole('link', { name: 'Lobby' });
    expect(lobby.className).toContain('text-accent-yellow');
    await waitFor(() => {
      ['Wallet', 'Promotions', 'Leaderboard', /Alerts/, /Profile/].forEach(
        (label: string | RegExp) => {
          expect(
            screen.getByRole('link', { name: label }).className.split(' '),
          ).not.toContain('text-accent-yellow');
        },
      );
    });
  });

  it('shows unread badge when notifications load', async () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 5 },
      isLoading: false,
      error: null,
    });
    renderNav();
    expect(await screen.findByText('5')).toBeInTheDocument();
  });

  it('hides badge on error', async () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });
    renderNav();
    await waitFor(() =>
      expect(screen.queryByText('5')).not.toBeInTheDocument(),
    );
  });

  it('renders nothing while loading', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 0 },
      isLoading: false,
      error: null,
    });
    mockFetchNavItems.mockReturnValue(new Promise(() => {}));
    renderNav();
    expect(
      screen.queryByRole('link', { name: 'Lobby' }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing on error', async () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 0 },
      isLoading: false,
      error: null,
    });
    mockFetchNavItems.mockRejectedValue(new Error('fail'));
    renderNav();
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'Lobby' }),
      ).not.toBeInTheDocument(),
    );
  });
});
