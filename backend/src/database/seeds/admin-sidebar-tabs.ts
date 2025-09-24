import type { QueryRunner } from 'typeorm';

export interface AdminSidebarTabSeed {
  id: string;
  label: string;
  icon: string;
  component: string;
  source?: 'config' | 'database';
}

export const CANONICAL_ADMIN_SIDEBAR_TABS: AdminSidebarTabSeed[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'faChartLine',
    component: '@/app/components/dashboard/analytics/Analytics',
    source: 'config',
  },
  {
    id: 'broadcast',
    label: 'Broadcasts',
    icon: 'faBullhorn',
    component: '@/app/components/dashboard/BroadcastPanel',
    source: 'config',
  },
  {
    id: 'bonuses',
    label: 'Bonuses',
    icon: 'faGift',
    component: '@/app/components/dashboard/BonusManager',
    source: 'config',
  },
  {
    id: 'deposits-reconcile',
    label: 'Bank Reconciliation',
    icon: 'faFileInvoiceDollar',
    component: '@/app/components/dashboard/AdminBankReconciliation',
    source: 'config',
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'faBell',
    component: '@/app/components/dashboard/AdminEvents',
    source: 'config',
  },
  {
    id: 'feature-flags',
    label: 'Feature Flags',
    icon: 'faToggleOn',
    component: '@/app/components/dashboard/FeatureFlagsPanel',
    source: 'config',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'faCog',
    component: '@/app/components/dashboard/Settings',
    source: 'config',
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: 'faTable',
    component: '@/app/components/dashboard/ManageTables',
    source: 'config',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: 'faMoneyBillWave',
    component: '@/app/components/dashboard/transactions/TransactionHistory',
    source: 'config',
  },
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: 'faTrophy',
    component: '@/app/components/dashboard/ManageTournaments',
    source: 'config',
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'faUsers',
    component: '@/app/components/dashboard/ManageUsers',
    source: 'config',
  },
  {
    id: 'wallet-iban',
    label: 'IBAN Manager',
    icon: 'faBuildingColumns',
    component: '@/app/components/dashboard/IbanManager',
    source: 'config',
  },
  {
    id: 'wallet-reconcile',
    label: 'Wallet Reconcile',
    icon: 'faCoins',
    component: '@/app/components/dashboard/WalletReconcileMismatches',
    source: 'config',
  },
  {
    id: 'wallet-withdrawals',
    label: 'Withdrawals',
    icon: 'faMoneyCheck',
    component: '@/app/components/dashboard/Withdrawals',
    source: 'config',
  },
  {
    id: 'collusion',
    label: 'Collusion Review',
    icon: 'faUserShield',
    component: '@/features/collusion',
    source: 'config',
  },
];

function makePlaceholders(count: number, startIndex = 1): string {
  return Array.from({ length: count }, (_, index) => `$${startIndex + index}`).join(',');
}

export async function applyCanonicalAdminSidebarTabs(
  queryRunner: QueryRunner,
): Promise<void> {
  if (CANONICAL_ADMIN_SIDEBAR_TABS.length === 0) {
    await queryRunner.query('DELETE FROM "admin_tab"');
    return;
  }

  const ids = CANONICAL_ADMIN_SIDEBAR_TABS.map((tab) => tab.id);
  const idPlaceholders = makePlaceholders(ids.length);

  await queryRunner.query(
    `DELETE FROM "admin_tab" WHERE "id" NOT IN (${idPlaceholders})`,
    ids,
  );

  for (const tab of CANONICAL_ADMIN_SIDEBAR_TABS) {
    await queryRunner.query(
      `INSERT INTO "admin_tab" ("id", "label", "icon", "component", "source")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("id") DO UPDATE
       SET "label" = EXCLUDED."label",
           "icon" = EXCLUDED."icon",
           "component" = EXCLUDED."component",
           "source" = EXCLUDED."source"`,
      [tab.id, tab.label, tab.icon, tab.component, tab.source ?? 'config'],
    );
  }
}

export async function removeCanonicalAdminSidebarTabs(
  queryRunner: QueryRunner,
): Promise<void> {
  if (CANONICAL_ADMIN_SIDEBAR_TABS.length === 0) {
    return;
  }

  const ids = CANONICAL_ADMIN_SIDEBAR_TABS.map((tab) => tab.id);
  const idPlaceholders = makePlaceholders(ids.length);

  await queryRunner.query(
    `DELETE FROM "admin_tab" WHERE "id" IN (${idPlaceholders})`,
    ids,
  );
}
