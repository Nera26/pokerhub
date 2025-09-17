import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../Sidebar';
import {
  faChartLine,
  faChartBar,
  faUsers,
  faBell,
} from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from '@/hooks/useNavItems';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const mockUseNavItems = jest.fn();

jest.mock('@/hooks/useNavItems', () => ({
  useNavItems: () => mockUseNavItems(),
}));

const renderWithItems = (items: NavItem[], selector: string) => {
  mockUseNavItems.mockReturnValueOnce({ items, loading: false, error: null });
  const { container } = render(<Sidebar open />);
  return waitFor(() =>
    expect(container.querySelector(selector)).toBeInTheDocument(),
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  push.mockClear();
  mockUseNavItems.mockReset();
  mockUseNavItems.mockReturnValue({
    items: [
      {
        flag: 'dashboard',
        href: '',
        label: 'Dashboard',
        icon: faChartLine,
        order: 1,
      },
      {
        flag: 'analytics',
        href: '',
        label: 'Analytics',
        icon: faChartBar,
        order: 2,
      },
    ],
    loading: false,
    error: null,
  });
});

describe('Sidebar', () => {
  it('renders items from API', async () => {
    mockUseNavItems.mockReturnValueOnce({
      items: [
        {
          flag: 'dashboard',
          href: '/dashboard',
          label: 'API Dashboard',
          icon: faChartLine,
          order: 1,
        },
        {
          flag: 'users',
          href: '/users',
          label: 'API Users',
          icon: faUsers,
          order: 2,
        },
      ],
      loading: false,
      error: null,
    });
    render(<Sidebar open />);
    expect(await screen.findByText('API Users')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    mockUseNavItems.mockReturnValueOnce({
      items: [],
      loading: false,
      error: new Error('fail'),
    });
    render(<Sidebar open />);
    expect(
      await screen.findByText('Failed to load sidebar'),
    ).toBeInTheDocument();
  });

  it('switches active tab when clicked', async () => {
    render(<Sidebar />);
    const user = userEvent.setup();

    const dashboardTab = await screen.findByRole('button', {
      name: /dashboard/i,
    });
    const analyticsTab = await screen.findByRole('button', {
      name: /analytics/i,
    });

    expect(dashboardTab).toHaveAttribute('aria-current', 'page');
    expect(analyticsTab).not.toHaveAttribute('aria-current');

    await user.click(analyticsTab);

    expect(analyticsTab).toHaveAttribute('aria-current', 'page');
    expect(dashboardTab).not.toHaveAttribute('aria-current');
  });

  it('calls onChange handler with selected tab', async () => {
    const onChange = jest.fn();
    render(<Sidebar active="users" onChange={onChange} />);
    const user = userEvent.setup();

    const dashboardTab = await screen.findByRole('button', {
      name: /dashboard/i,
    });
    await user.click(dashboardTab);

    expect(onChange).toHaveBeenCalledWith('dashboard');
  });

  it('renders icons provided by the server', async () => {
    await renderWithItems(
      [
        {
          flag: 'users',
          href: '/users',
          label: 'Users',
          icon: faUsers,
          order: 1,
        },
      ],
      'svg[data-icon="users"]',
    );
  });

  it('renders notification badge when provided', async () => {
    mockUseNavItems.mockReturnValueOnce({
      items: [
        {
          flag: 'notifications',
          href: '/notifications',
          label: 'Notifications',
          icon: faBell,
          order: 1,
          badge: 5,
        },
      ],
      loading: false,
      error: null,
    });
    render(<Sidebar open />);
    expect(await screen.findByText('5')).toBeInTheDocument();
  });
});
