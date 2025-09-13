import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '@/app/dashboard/page';

const replace = jest.fn();
let searchParams = new URLSearchParams('tab=users');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard',
  useSearchParams: () => searchParams,
}));

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({ data: null, error: null, isLoading: false }),
}));

jest.mock('@/lib/api/profile', () => ({
  fetchProfile: jest.fn().mockResolvedValue({ avatarUrl: '/a.png' }),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchSidebarItems: jest.fn().mockResolvedValue([]),
  fetchAdminTabs: jest.fn().mockResolvedValue([
    {
      id: 'users',
      title: 'Users',
      component: '@/app/components/dashboard/ManageUsers',
    },
    {
      id: 'tables',
      title: 'Tables',
      component: '@/app/components/dashboard/ManageTables',
    },
    {
      id: 'tournaments',
      title: 'Tournaments',
      component: '@/app/components/dashboard/ManageTournaments',
    },
  ]),
  fetchAdminTabMeta: jest.fn(),
}));

jest.mock('@/app/components/dashboard/ManageUsers', () => () => (
  <div>Users Module</div>
));
jest.mock('@/app/components/dashboard/ManageTables', () => () => (
  <div>Tables Module</div>
));
jest.mock('@/app/components/dashboard/ManageTournaments', () => () => (
  <div>Tournaments Module</div>
));

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

describe('dashboard tab navigation', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('renders users module when tab=users', async () => {
    searchParams = new URLSearchParams('tab=users');
    renderPage();
    expect(await screen.findByText('Users Module')).toBeInTheDocument();
  });

  it('renders tables module when tab=tables', async () => {
    searchParams = new URLSearchParams('tab=tables');
    renderPage();
    expect(await screen.findByText('Tables Module')).toBeInTheDocument();
  });

  it('renders tournaments module when tab=tournaments', async () => {
    searchParams = new URLSearchParams('tab=tournaments');
    renderPage();
    expect(await screen.findByText('Tournaments Module')).toBeInTheDocument();
  });
});
