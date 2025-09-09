import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/dashboard/page';

jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn().mockResolvedValue([
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

jest.mock('@/app/components/dashboard/DashboardModule', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: [
      {
        id: 'users',
        title: 'Users',
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

const replace = jest.fn();
let searchParams = new URLSearchParams('?tab=users');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard',
  useSearchParams: () => searchParams,
}));

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    data: null,
    error: null,
    isLoading: false,
  }),
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

describe('Dashboard tab syncing', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams('?tab=users');
  });

  it('updates URL and visible panel when switching tabs', async () => {
    const user = userEvent.setup();
    render(<Page />);
    const analyticsBtn = await screen.findByRole('button', {
      name: /analytics/i,
    });
    await user.click(analyticsBtn);
    expect(replace).toHaveBeenCalledWith('/dashboard?tab=analytics');
  });
});
