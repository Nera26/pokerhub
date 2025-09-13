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

export function setSearchParams(qs: string) {
  searchParams = new URLSearchParams(qs);
}

export function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

export { replace };

describe('admin nav tabs', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it.each([
    ['users', 'Users Module'],
    ['tables', 'Tables Module'],
  ])('renders %s module', async (tab, text) => {
    setSearchParams(`tab=${tab}`);
    renderPage();
    expect(
      await screen.findByText(text, { exact: false }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
