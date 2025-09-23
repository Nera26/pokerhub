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
  fetchAdminTabs: jest.fn().mockResolvedValue([
    {
      id: 'analytics',
      title: 'Analytics',
      component: '@/app/components/dashboard/analytics/Analytics',
      source: 'config',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      component: '@/app/components/dashboard/transactions/TransactionHistory',
      source: 'config',
    },
    {
      id: 'deposits-reconcile',
      title: 'Bank Reconciliation',
      component: '@/app/components/dashboard/AdminBankReconciliation',
      source: 'config',
    },
    {
      id: 'settings',
      title: 'Settings',
      component: '@/app/components/dashboard/Settings',
      source: 'config',
    },
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
      id: 'feature-flags',
      title: 'Feature Flags',
      component: '@/app/components/dashboard/FeatureFlagsPanel',
    },
    {
      id: 'tournaments',
      title: 'Tournaments',
      component: '@/app/components/dashboard/ManageTournaments',
    },
    {
      id: 'broadcast',
      title: 'Broadcasts',
      component: '@/app/components/dashboard/BroadcastPanel',
    },
    {
      id: 'wallet-iban',
      title: 'Wallet IBAN',
      component: '@/app/components/dashboard/IbanManager',
    },
  ]),
  fetchAdminTabMeta: jest.fn(),
}));

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/components/dashboard/analytics/Analytics', () => () => (
  <div>Analytics Module</div>
));
jest.mock('@/app/components/dashboard/Sidebar', () => () => <div>Sidebar</div>);
jest.mock('@/app/components/dashboard/ManageUsers', () => () => (
  <div>Users Module</div>
));
jest.mock('@/app/components/dashboard/ManageTables', () => () => (
  <div>Tables Module</div>
));
jest.mock('@/app/components/dashboard/FeatureFlagsPanel', () => () => (
  <div>Feature Flags Module</div>
));
jest.mock(
  '@/app/components/dashboard/transactions/TransactionHistory',
  () => () => <div>Transactions Module</div>,
);
jest.mock('@/app/components/dashboard/ManageTournaments', () => () => (
  <div>Tournaments Module</div>
));
jest.mock('@/app/components/dashboard/AdminBankReconciliation', () => () => (
  <div>Bank Reconciliation Module</div>
));
jest.mock('@/app/components/dashboard/BroadcastPanel', () => () => (
  <div>Broadcast Module</div>
));
jest.mock('@/app/components/dashboard/IbanManager', () => () => (
  <div>IBAN Manager Module</div>
));
jest.mock('@/app/components/dashboard/Settings', () => () => (
  <div>Settings Module</div>
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
    ['analytics', 'Analytics Module'],
    ['feature-flags', 'Feature Flags Module'],
    ['transactions', 'Transactions Module'],
    ['deposits-reconcile', 'Bank Reconciliation Module'],
    ['settings', 'Settings Module'],
    ['users', 'Users Module'],
    ['tables', 'Tables Module'],
    ['tournaments', 'Tournaments Module'],
    ['broadcast', 'Broadcast Module'],
    ['wallet-iban', 'IBAN Manager Module'],
  ])('renders %s module', async (tab, text) => {
    setSearchParams(`tab=${tab}`);
    renderPage();
    expect(
      await screen.findByText(text, { exact: false }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
