import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../Sidebar';
import { fetchSidebarItems } from '@/lib/api/admin';
import type { SidebarItem } from '@shared/types';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn(),
}));

const renderWithItems = async (items: SidebarItem[], selector: string) => {
  (fetchSidebarItems as jest.Mock).mockResolvedValueOnce(items);
  const { container } = render(<Sidebar open />);
  await waitFor(() => expect(fetchSidebarItems).toHaveBeenCalled());
  await waitFor(() =>
    expect(container.querySelector(selector)).toBeInTheDocument(),
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  push.mockClear();
  (fetchSidebarItems as jest.Mock).mockResolvedValue([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'faChartLine',
      component: '@/app/components/dashboard/DashboardModule',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'faChartBar',
      component: '@/app/components/dashboard/DashboardModule',
    },
  ]);
});

describe('Sidebar', () => {
  it('renders items from API', async () => {
    (fetchSidebarItems as jest.Mock).mockResolvedValueOnce([
      {
        id: 'dashboard',
        label: 'API Dashboard',
        icon: 'faChartLine',
        component: '@/app/components/dashboard/DashboardModule',
      },
      {
        id: 'users',
        label: 'API Users',
        icon: 'faUsers',
        component: '@/app/components/dashboard/DashboardModule',
      },
    ]);
    render(<Sidebar open />);
    await waitFor(() => expect(fetchSidebarItems).toHaveBeenCalled());
    expect(await screen.findByText('API Users')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    (fetchSidebarItems as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    render(<Sidebar open />);
    await waitFor(() => expect(fetchSidebarItems).toHaveBeenCalled());
    expect(
      await screen.findByText('Failed to load sidebar'),
    ).toBeInTheDocument();
  });

  it('switches active tab when clicked', async () => {
    render(<Sidebar />);
    const user = userEvent.setup();

    await waitFor(() => expect(fetchSidebarItems).toHaveBeenCalled());

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

    await waitFor(() => expect(fetchSidebarItems).toHaveBeenCalled());

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
          id: 'users',
          label: 'Users',
          icon: 'faUsers',
          component: '@/app/components/dashboard/DashboardModule',
        },
      ],
      'svg[data-icon="users"]',
    );
  });

  it('falls back to default icon when server icon is unknown', async () => {
    await renderWithItems(
      [
        {
          id: 'unknown',
          label: 'Unknown',
          icon: 'faDoesNotExist',
          component: '@/app/components/dashboard/DashboardModule',
        },
      ],
      'svg[data-icon="chart-line"]',
    );
  });
});
