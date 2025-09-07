import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/dashboard/page';

jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn().mockResolvedValue([
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'analytics', label: 'Analytics', icon: 'chart-bar' },
  ]),
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

jest.mock('@/app/components/dashboard/UserManager', () => ({
  __esModule: true,
  default: () => <div>Users Panel</div>,
}));

jest.mock('@/app/components/dashboard/analytics/Analytics', () => ({
  __esModule: true,
  default: () => <div>Analytics Panel</div>,
}));

describe('Dashboard tab syncing', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams('?tab=users');
  });

  it('updates URL and visible panel when switching tabs', async () => {
    const user = userEvent.setup();
    render(<Page />);
    expect(await screen.findByText(/users panel/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /analytics/i }));

    expect(replace).toHaveBeenCalledWith('/dashboard?tab=analytics');
    expect(await screen.findByText(/analytics panel/i)).toBeInTheDocument();
    expect(screen.queryByText(/users panel/i)).not.toBeInTheDocument();
  });
});
