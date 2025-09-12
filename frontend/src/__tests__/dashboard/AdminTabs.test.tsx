import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '@/app/dashboard/page';

const replace = jest.fn();
let searchParams = new URLSearchParams('');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard',
  useSearchParams: () => searchParams,
}));

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({ data: null, error: null, isLoading: false }),
}));

jest.mock('@/app/components/dashboard/DashboardModule', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/api/profile', () => ({
  fetchProfile: jest.fn().mockResolvedValue({ avatarUrl: '/a.png' }),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn().mockResolvedValue([]),
  fetchAdminTabs: jest.fn(),
  fetchAdminTabMeta: jest.fn(),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

describe('Admin tabs loading', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParams = new URLSearchParams('');
  });

  it('shows loading state then renders title', async () => {
    const { fetchAdminTabs } = require('@/lib/api/admin');
    (fetchAdminTabs as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve([
                {
                  id: 'dashboard',
                  title: 'Dashboard',
                  component: '@/app/components/dashboard/DashboardModule',
                },
              ]),
            0,
          ),
        ),
    );
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /dashboard/i }),
    ).toBeInTheDocument();
  });

  it('handles empty response', async () => {
    const { fetchAdminTabs } = require('@/lib/api/admin');
    (fetchAdminTabs as jest.Mock).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/no tabs available/i)).toBeInTheDocument();
  });

  it('handles error response', async () => {
    const { fetchAdminTabs } = require('@/lib/api/admin');
    (fetchAdminTabs as jest.Mock).mockRejectedValue(new Error('fail'));
    renderPage();
    expect(await screen.findByText(/error loading tabs/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /admin dashboard/i }),
    ).toBeInTheDocument();
  });

  it('shows backend message when tab disabled', async () => {
    const { fetchAdminTabs, fetchAdminTabMeta } = require('@/lib/api/admin');
    (fetchAdminTabs as jest.Mock).mockResolvedValue([
      {
        id: 'dashboard',
        title: 'Dashboard',
        component: '@/app/components/dashboard/DashboardModule',
      },
    ]);
    (fetchAdminTabMeta as jest.Mock).mockResolvedValue({
      id: 'reports',
      title: 'Reports',
      component: '@/app/components/dashboard/Reports',
      enabled: false,
      message: 'Reports disabled by admin',
    });
    searchParams = new URLSearchParams('tab=reports');
    renderPage();
    expect(
      await screen.findByText(/reports disabled by admin/i),
    ).toBeInTheDocument();
  });
});
