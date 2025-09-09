import { render, screen } from '@testing-library/react';
import BottomNav from '@/app/components/common/BottomNav';

const mockUsePathname = jest.fn();
const mockUseAuth = jest.fn();
const mockUseNotifications = jest.fn();
const mockUseFeatureFlags = jest.fn();

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

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUseAuth.mockReset();
    mockUseNotifications.mockReset();
    mockUseFeatureFlags.mockReset();
  });

  it('activates item when pathname starts with href', () => {
    mockUsePathname.mockReturnValue('/wallet/deposit');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 2 },
      isLoading: false,
      error: null,
    });
    mockUseFeatureFlags.mockReturnValue({ data: {} });
    render(<BottomNav />);
    const wallet = screen.getByRole('link', { name: 'Wallet' });
    expect(wallet.className).toContain('text-accent-yellow');
  });

  it('only marks lobby active on root path', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 0 },
      isLoading: false,
      error: null,
    });
    mockUseFeatureFlags.mockReturnValue({ data: {} });
    render(<BottomNav />);
    const lobby = screen.getByRole('link', { name: 'Lobby' });
    expect(lobby.className).toContain('text-accent-yellow');
    ['Wallet', 'Promotions', 'Leaders', /Alerts/, /Profile/].forEach(
      (label: string | RegExp) => {
        expect(
          screen.getByRole('link', { name: label }).className.split(' '),
        ).not.toContain('text-accent-yellow');
      },
    );
  });

  it('shows unread badge when notifications load', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: { unread: 5 },
      isLoading: false,
      error: null,
    });
    mockUseFeatureFlags.mockReturnValue({ data: {} });
    render(<BottomNav />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides badge on error', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseAuth.mockReturnValue({ avatarUrl: '/a.png' });
    mockUseNotifications.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });
    mockUseFeatureFlags.mockReturnValue({ data: {} });
    render(<BottomNav />);
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('hides nav items when flags are disabled', () => {
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
    render(<BottomNav />);
    expect(
      screen.queryByRole('link', { name: 'Promotions' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Alerts/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Wallet' })).toBeInTheDocument();
  });
});
