import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../Sidebar';
import { fetchNavItems, type NavItem } from '@/lib/api/nav';
import {
  faChartLine,
  faChartBar,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn(),
}));

const renderWithItems = async (items: NavItem[], selector: string) => {
  (fetchNavItems as jest.Mock).mockResolvedValueOnce(items);
  const { container } = render(<Sidebar open />);
  await waitFor(() => expect(fetchNavItems).toHaveBeenCalled());
  await waitFor(() =>
    expect(container.querySelector(selector)).toBeInTheDocument(),
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  push.mockClear();
  (fetchNavItems as jest.Mock).mockResolvedValue([
    {
      flag: 'dashboard',
      href: '/dashboard',
      label: 'Dashboard',
      icon: faChartLine,
    },
    {
      flag: 'analytics',
      href: '/analytics',
      label: 'Analytics',
      icon: faChartBar,
    },
  ]);
});

describe('Sidebar', () => {
  it('renders items from API', async () => {
    (fetchNavItems as jest.Mock).mockResolvedValueOnce([
      {
        flag: 'dashboard',
        href: '/dashboard',
        label: 'API Dashboard',
        icon: faChartLine,
      },
      { flag: 'users', href: '/users', label: 'API Users', icon: faUsers },
    ]);
    render(<Sidebar open />);
    await waitFor(() => expect(fetchNavItems).toHaveBeenCalled());
    expect(await screen.findByText('API Users')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    (fetchNavItems as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<Sidebar open />);
    await waitFor(() => expect(fetchNavItems).toHaveBeenCalled());
    expect(
      await screen.findByText('Failed to load sidebar'),
    ).toBeInTheDocument();
  });

  it('switches active tab when clicked', async () => {
    render(<Sidebar />);
    const user = userEvent.setup();

    await waitFor(() => expect(fetchNavItems).toHaveBeenCalled());

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

    await waitFor(() => expect(fetchNavItems).toHaveBeenCalled());

    const dashboardTab = await screen.findByRole('button', {
      name: /dashboard/i,
    });
    await user.click(dashboardTab);

    expect(onChange).toHaveBeenCalledWith('dashboard');
  });

  it('renders icons provided by the server', async () => {
    await renderWithItems(
      [{ flag: 'users', href: '/users', label: 'Users', icon: faUsers }],
      'svg[data-icon="users"]',
    );
  });
});
