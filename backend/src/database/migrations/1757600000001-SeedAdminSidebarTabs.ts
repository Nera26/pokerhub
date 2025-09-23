import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_TABS = [
  {
    id: 'events',
    label: 'Events',
    icon: 'faBell',
    component: '@/app/components/dashboard/AdminEvents',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: 'faMoneyBillWave',
    component: '@/app/components/dashboard/transactions/TransactionHistory',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'faChartLine',
    component: '@/app/components/dashboard/analytics/Analytics',
  },
  {
    id: 'feature-flags',
    label: 'Feature Flags',
    icon: 'faToggleOn',
    component: '@/app/components/dashboard/FeatureFlagsPanel',
  },
  {
    id: 'broadcast',
    label: 'Broadcasts',
    icon: 'faBullhorn',
    component: '@/app/components/dashboard/BroadcastPanel',
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
  {
    id: 'wallet-iban',
    label: 'IBAN Manager',
    icon: 'faBuildingColumns',
    component: '@/app/components/dashboard/IbanManager',
  },
];

export class SeedAdminSidebarTabs1757600000001 implements MigrationInterface {
  name = 'SeedAdminSidebarTabs1757600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = DEFAULT_TABS.map(
      (tab) =>
        `('${tab.id}', '${tab.label}', '${tab.icon}', '${tab.component}')`,
    ).join(',');
    await queryRunner.query(
      `INSERT INTO "admin_tab" ("id", "label", "icon", "component") VALUES ${values} ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const ids = DEFAULT_TABS.map((tab) => `'${tab.id}'`).join(',');
    await queryRunner.query(
      `DELETE FROM "admin_tab" WHERE "id" IN (${ids})`,
    );
  }
}
