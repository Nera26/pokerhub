/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '../index';

const mockUseSearchParams = jest.fn(() => new URLSearchParams(''));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock('@/app/components/dashboard/Sidebar', () => () => <div />);
jest.mock('@/app/components/dashboard/DashboardModule', () => () => <div />);
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    data: { online: 0, revenue: 0 },
    error: null,
    isLoading: false,
  }),
}));
jest.mock('@/lib/api/profile', () => ({
  fetchProfile: jest.fn().mockResolvedValue({ avatarUrl: null }),
}));

const mockFetchAdminTabs = jest.fn();
const mockFetchAdminTabMeta = jest.fn();
jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: (...args: any[]) => mockFetchAdminTabs(...args),
  fetchAdminTabMeta: (...args: any[]) => mockFetchAdminTabMeta(...args),
}));

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockUseSearchParams.mockReturnValue(new URLSearchParams(''));
  mockFetchAdminTabs.mockReset();
  mockFetchAdminTabMeta.mockReset();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      title: '',
      description: '',
      imagePath: '',
      defaultAvatar: '',
    }),
  });
});

describe('admin tabs', () => {
  it('shows loading indicator while tabs are loading', () => {
    mockFetchAdminTabs.mockReturnValue(new Promise(() => {}));
    setup();
    expect(screen.getByText('Loading tabs...')).toBeInTheDocument();
  });

  it('shows empty state when no tabs returned', async () => {
    mockFetchAdminTabs.mockResolvedValue([]);
    setup();
    await screen.findByText('No tabs available.');
  });

  it('shows error message from failed tabs request', async () => {
    mockFetchAdminTabs.mockRejectedValue(new Error('boom'));
    mockFetchAdminTabMeta.mockResolvedValue({
      enabled: false,
      title: 'Dashboard',
      message: 'meta',
      component: '',
    });
    setup();
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });

  it('renders disabled tab message from meta', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=broadcast'));
    mockFetchAdminTabs.mockResolvedValue([
      { id: 'dashboard', title: 'Dashboard', component: './dummy' },
    ]);
    mockFetchAdminTabMeta.mockResolvedValue({
      enabled: false,
      title: 'Broadcast',
      message: 'Coming soon',
      component: '',
    });
    setup();
    await screen.findByText('Coming soon');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Broadcast' }),
    ).toBeInTheDocument();
  });

  it('displays error message when tab meta fetch fails', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=broadcast'));
    mockFetchAdminTabs.mockResolvedValue([
      { id: 'dashboard', title: 'Dashboard', component: './dummy' },
    ]);
    mockFetchAdminTabMeta.mockRejectedValue(new Error('Not found'));
    setup();
    await screen.findByText('Not found');
  });
});
