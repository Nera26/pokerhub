import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/dashboard/page';

const replace = jest.fn();
const push = jest.fn();
let searchParams = new URLSearchParams('?tab=users');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
  usePathname: () => '/dashboard',
  useSearchParams: () => searchParams,
}));

jest.mock('@/app/components/dashboard/DashboardModule', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    data: null,
    error: null,
    isLoading: false,
  }),
}));
jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn().mockResolvedValue([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'chart-line',
      component: '@/app/components/dashboard/DashboardModule',
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'users',
      component: '@/app/components/dashboard/DashboardModule',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'chart-bar',
      component: '@/app/components/dashboard/DashboardModule',
    },
  ]),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        component: '@/app/components/dashboard/DashboardModule',
      },
      {
        id: 'users',
        title: 'Manage Users',
        component: '@/app/components/dashboard/DashboardModule',
      },
      {
        id: 'analytics',
        title: 'Analytics',
        component: '@/app/components/dashboard/DashboardModule',
      },
    ],
    isLoading: false,
    isError: false,
  })),
}));
jest.mock('@/lib/api/profile', () => ({
  fetchProfile: jest.fn().mockResolvedValue({
    username: 'Admin',
    email: 'admin@example.com',
    avatarUrl: '/a.png',
    bank: '',
    location: '',
    joined: '2024-01-01T00:00:00Z',
    bio: '',
    experience: 0,
    balance: 0,
  }),
}));

describe('Dashboard page', () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
    searchParams = new URLSearchParams('?tab=users');
  });

  it('uses ?tab param for initial state', async () => {
    render(<Page />);
    expect(
      await screen.findByRole('button', { name: /users/i }),
    ).toHaveAttribute('aria-current', 'page');
    expect(replace).not.toHaveBeenCalled();
  });

  it('syncs tab changes to URL', async () => {
    const user = userEvent.setup();
    render(<Page />);
    const analyticsBtn = await screen.findByRole('button', {
      name: /analytics/i,
    });
    await user.click(analyticsBtn);
    expect(replace).toHaveBeenCalledWith('/dashboard?tab=analytics');
  });
});
