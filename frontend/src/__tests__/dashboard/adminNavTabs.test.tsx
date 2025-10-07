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
      component: '@/components/dashboard/analytics/analytics',
      source: 'config',
    },
    {
      id: 'transactions',
      title: 'Transactions',
      component: '@/components/dashboard/transactions/transaction-history',
      source: 'config',
    },
    {
      id: 'deposits-reconcile',
      title: 'Bank Reconciliation',
      component: '@/components/dashboard/admin-bank-reconciliation',
      source: 'config',
    },
    {
      id: 'settings',
      title: 'Settings',
      component: '@/components/dashboard/settings',
      source: 'config',
    },
    {
      id: 'users',
      title: 'Users',
      component: '@/components/dashboard/manage-users',
    },
    {
      id: 'tables',
      title: 'Tables',
      component: '@/components/dashboard/manage-tables',
    },
    {
      id: 'tournaments',
      title: 'Tournaments',
      component: '@/components/dashboard/manage-tournaments',
    },
    {
      id: 'broadcast',
      title: 'Broadcasts',
      component: '@/components/dashboard/broadcast-panel',
    },
    {
      id: 'bonuses',
      title: 'Bonuses',
      component: '@/components/dashboard/bonus-manager',
      source: 'database',
    },
    {
      id: 'wallet-iban',
      title: 'Wallet IBAN',
      component: '@/components/dashboard/iban-manager',
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
  fetchBonusStats: jest.fn().mockResolvedValue({
    activeBonuses: 0,
    weeklyClaims: 0,
    completedPayouts: 0,
    currency: 'USD',
    conversionRate: 0,
  }),
  createBonusDefaults: jest.fn(),
  updateBonusDefaults: jest.fn(),
  deleteBonusDefaults: jest.fn(),
}));

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/components/dashboard/analytics/analytics', () => () => (
  <div>Analytics Module</div>
));
jest.mock('@/components/dashboard/sidebar', () => () => <div>Sidebar</div>);
jest.mock('@/components/dashboard/manage-users', () => () => (
  <div>Users Module</div>
));
jest.mock('@/features/collusion', () => () => <div>Collusion Module</div>);
jest.mock('@/components/dashboard/manage-tables', () => () => (
  <div>Tables Module</div>
));
jest.mock('@/components/dashboard/feature-flags-panel', () => () => (
  <div>Feature Flags Module</div>
));
jest.mock(
  '@/components/dashboard/transactions/transaction-history',
  () => () => <div>Transactions Module</div>,
);
jest.mock('@/components/dashboard/manage-tournaments', () => () => (
  <div>Tournaments Module</div>
));
jest.mock('@/components/dashboard/admin-bank-reconciliation', () => () => (
  <div>Bank Reconciliation Module</div>
));
jest.mock('@/components/dashboard/broadcast-panel', () => () => (
  <div>Broadcast Module</div>
));
jest.mock('@/components/dashboard/iban-manager', () => () => (
  <div>IBAN Manager Module</div>
));
jest.mock('@/components/dashboard/settings', () => () => (
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
