import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import BottomNav from '../BottomNav';
import NavigationLinks from '../header/NavigationLinks';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';

const mockUseNavItems = jest.fn();
const mockUsePathname = jest.fn();

jest.mock('@/hooks/useNavItems', () => ({
  useNavItems: () => mockUseNavItems(),
}));

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn().mockResolvedValue([]),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => {
  return ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock('next/image', () => (props: any) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt} />;
});

jest.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ data: {} }),
}));

describe('navigation components', () => {
  function renderWithClient(ui: ReactNode) {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
  }

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    mockUseNavItems.mockReturnValue({
      loading: false,
      items: [
        {
          flag: 'profile',
          href: '/user',
          label: 'Profile',
          avatar: '/avatar.png',
        },
        {
          flag: 'notifications',
          href: '/notifications',
          label: 'Alerts',
          icon: faBell,
          badge: 3,
        },
      ],
    });
  });

  it('renders avatar and badge in BottomNav', () => {
    renderWithClient(<BottomNav />);
    expect(screen.getByAltText('User Avatar')).toHaveAttribute(
      'src',
      '/avatar.png',
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders avatar and badge in NavigationLinks', () => {
    renderWithClient(<NavigationLinks balance="$0.00" />);
    expect(screen.getByAltText('User Avatar')).toHaveAttribute(
      'src',
      '/avatar.png',
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
