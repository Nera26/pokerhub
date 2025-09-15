import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/dashboard/page';
import { mockProfile } from '../utils/mockProfile';

const replace = jest.fn();
let searchParams = new URLSearchParams('?tab=users');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
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
jest.mock('@/lib/api/admin', () => ({}));

import {
  faChartLine,
  faUsers,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn().mockResolvedValue([
    {
      flag: 'dashboard',
      href: '/dashboard',
      label: 'Dashboard',
      icon: faChartLine,
    },
    { flag: 'users', href: '/users', label: 'Users', icon: faUsers },
    {
      flag: 'analytics',
      href: '/analytics',
      label: 'Analytics',
      icon: faChartBar,
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
jest.mock('@/lib/api/profile', () => mockProfile());

describe('Dashboard page', () => {
  beforeEach(() => {
    replace.mockClear();
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
    await user.click(await screen.findByRole('button', { name: /analytics/i }));
    expect(replace).toHaveBeenCalledWith('/dashboard?tab=analytics');
  });
});
