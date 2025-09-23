import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '@/app/dashboard/page';
import { fetchBonuses } from '@/lib/api/admin';

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

jest.mock('@/lib/api/admin', () => {
  const defaultTabs = [
    {
      id: 'collusion',
      title: 'Collusion Review',
      component: '@/features/collusion',
      source: 'config',
    },
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
      id: 'bonuses',
      title: 'Bonuses',
      component: '@/app/components/dashboard/BonusManager',
      source: 'database',
    },
    {
      id: 'wallet-iban',
      title: 'Wallet IBAN',
      component: '@/app/components/dashboard/IbanManager',
    },
  ];
  return {
    fetchAdminTabs: jest.fn().mockResolvedValue(defaultTabs),
    fetchAdminTabMeta: jest.fn(),
    fetchBonuses: jest.fn().mockResolvedValue([]),
    createBonus: jest.fn().mockResolvedValue({
      id: 1,
      name: 'New Bonus',
      type: 'deposit',
      description: 'New bonus',
      bonusPercent: 100,
      maxBonusUsd: 500,
      expiryDate: '2025-12-31',
      eligibility: 'all',
      status: 'active',
      claimsTotal: 0,
      claimsWeek: 0,
    }),
    updateBonus: jest.fn().mockResolvedValue({}),
    deleteBonus: jest.fn().mockResolvedValue({ message: 'ok' }),
    fetchBonusOptions: jest.fn().mockResolvedValue({
      types: [
        { label: 'Deposit', value: 'deposit' },
        { label: 'Rakeback', value: 'rakeback' },
      ],
      eligibilities: [{ label: 'All Players', value: 'all' }],
      statuses: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    }),
  };
});

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => ({ data: undefined }),
}));

jest.mock('@/lib/api/bonus', () => ({
  fetchBonusDefaults: jest.fn().mockResolvedValue({
    name: '',
    type: 'deposit',
    description: '',
    bonusPercent: 100,
    maxBonusUsd: 500,
    expiryDate: undefined,
    eligibility: 'all',
    status: 'active',
  }),
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
jest.mock('@/features/collusion', () => () => <div>Collusion Module</div>);
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
    jest.clearAllMocks();
    (fetchBonuses as jest.Mock).mockResolvedValue([]);
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
    ['bonuses', 'Bonus Manager'],
    ['wallet-iban', 'IBAN Manager Module'],
  ])('renders %s module', async (tab, text) => {
    setSearchParams(`tab=${tab}`);
    renderPage();
    expect(
      await screen.findByText(text, { exact: false }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('loads bonuses tab data via fetchBonuses', async () => {
    const bonus = {
      id: 1,
      name: 'Welcome Bonus',
      type: 'deposit',
      description: '100% match up to $500',
      bonusPercent: 100,
      maxBonusUsd: 500,
      expiryDate: '2025-12-31',
      eligibility: 'all',
      status: 'active',
      claimsTotal: 10,
      claimsWeek: 4,
    };
    (fetchBonuses as jest.Mock).mockResolvedValue([bonus]);

    setSearchParams('tab=bonuses');
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bonuses' }),
    ).toBeInTheDocument();
    await screen.findByText(
      'Bonus Manager',
      { exact: false },
      { timeout: 5000 },
    );
    await waitFor(() => expect(fetchBonuses).toHaveBeenCalled());
  });
});
