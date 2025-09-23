import type { QueryRunner } from 'typeorm';

export interface AdminSidebarTabSeed {
  id: string;
  label: string;
  icon: string;
  component: string;
}

export const CANONICAL_ADMIN_SIDEBAR_TABS: AdminSidebarTabSeed[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'faChartLine',
    component: '@/app/components/dashboard/analytics/Analytics',
  },
  {
    id: 'broadcast',
    label: 'Broadcasts',
    icon: 'faBullhorn',
    component: '@/app/components/dashboard/BroadcastPanel',
  },
  {
    id: 'bonuses',
    label: 'Bonuses',
    icon: 'faGift',
    component: '@/app/components/dashboard/BonusManager',
  },
  {
    id: 'deposits-reconcile',
    label: 'Bank Reconciliation',
    icon: 'faFileInvoiceDollar',
    component: '@/app/components/dashboard/AdminBankReconciliation',
  },
  {
    id: 'events',
    label: 'Events',
    icon: 'faBell',
    component: '@/app/components/dashboard/AdminEvents',
  },
  {
    id: 'feature-flags',
    label: 'Feature Flags',
    icon: 'faToggleOn',
    component: '@/app/components/dashboard/FeatureFlagsPanel',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'faCog',
    component: '@/app/components/dashboard/Settings',
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: 'faTable',
    component: '@/app/components/dashboard/ManageTables',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: 'faMoneyBillWave',
    component: '@/app/components/dashboard/transactions/TransactionHistory',
  },
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: 'faTrophy',
    component: '@/app/components/dashboard/ManageTournaments',
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'faUsers',
    component: '@/app/components/dashboard/ManageUsers',
  },
  {
    id: 'wallet-iban',
    label: 'IBAN Manager',
    icon: 'faBuildingColumns',
    component: '@/app/components/dashboard/IbanManager',
  },
  {
    id: 'wallet-reconcile',
    label: 'Wallet Reconcile',
    icon: 'faCoins',
    component: '@/app/components/dashboard/WalletReconcileMismatches',
  },
  {
    id: 'wallet-withdrawals',
    label: 'Withdrawals',
    icon: 'faMoneyCheck',
    component: '@/app/components/dashboard/Withdrawals',
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
      `INSERT INTO "admin_tab" ("id", "label", "icon", "component")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("id") DO UPDATE
       SET "label" = EXCLUDED."label",
           "icon" = EXCLUDED."icon",
           "component" = EXCLUDED."component"`,
      [tab.id, tab.label, tab.icon, tab.component],
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
