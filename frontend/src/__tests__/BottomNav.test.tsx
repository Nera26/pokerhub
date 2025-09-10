import { render, screen, waitFor } from '@testing-library/react';
import BottomNav from '@/app/components/common/BottomNav';
import { faHome } from '@fortawesome/free-solid-svg-icons/faHome';
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchNavItems } from '@/lib/api/nav';

const mockUsePathname = jest.fn();
const mockUseAuth = jest.fn();
const mockUseNotifications = jest.fn();
const mockUseFeatureFlags = jest.fn();
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

jest.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => mockUseFeatureFlags(),
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
    label: 'Leaders',
    icon: faTrophy,
  },
  {
    flag: 'notifications',
    href: '/notification',
    label: 'Alerts',
    icon: faBell,
  },
  { flag: 'profile', href: '/profile', label: 'Profile' },
];

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUseAuth.mockReset();
    mockUseNotifications.mockReset();
    mockUseFeatureFlags.mockReset();
    mockFetchNavItems.mockReset();
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
    mockUseFeatureFlags.mockReturnValue({ data: {} });
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
    mockUseFeatureFlags.mockReturnValue({ data: {} });
    renderNav();
    const lobby = await screen.findByRole('link', { name: 'Lobby' });
    expect(lobby.className).toContain('text-accent-yellow');
    await waitFor(() => {
      ['Wallet', 'Promotions', 'Leaders', /Alerts/, /Profile/].forEach(
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
    mockUseFeatureFlags.mockReturnValue({ data: {} });
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
    mockUseFeatureFlags.mockReturnValue({ data: {} });
    renderNav();
    await waitFor(() =>
      expect(screen.queryByText('5')).not.toBeInTheDocument(),
    );
  });

  it('hides nav items when flags are disabled', async () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 0 },
      isLoading: false,
      error: null,
    });
    mockUseFeatureFlags.mockReturnValue({
      data: { promotions: false, notifications: false },
    });
    renderNav();
    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Promotions' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /Alerts/ }),
      ).not.toBeInTheDocument();
    });
    expect(
      await screen.findByRole('link', { name: 'Wallet' }),
    ).toBeInTheDocument();
  });

  it('renders nothing while loading', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 0 },
      isLoading: false,
      error: null,
    });
    mockUseFeatureFlags.mockReturnValue({ data: {} });
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
    mockUseFeatureFlags.mockReturnValue({ data: {} });
    mockFetchNavItems.mockRejectedValue(new Error('fail'));
    renderNav();
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'Lobby' }),
      ).not.toBeInTheDocument(),
    );
  });
});
