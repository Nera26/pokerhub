import { MigrationInterface, QueryRunner } from 'typeorm';

const STATIC_TABS = [
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
    id: 'deposits-reconcile',
    label: 'Bank Reconciliation',
    icon: 'faFileInvoiceDollar',
    component: '@/app/components/dashboard/AdminBankReconciliation',
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
];

export class SeedAdminConfigTabs1757600000002 implements MigrationInterface {
  name = 'SeedAdminConfigTabs1757600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = STATIC_TABS.map(
      (tab) =>
        `('${tab.id}', '${tab.label}', '${tab.icon}', '${tab.component}')`,
    ).join(',');

    if (!values) {
      return;
    }

    await queryRunner.query(
      `INSERT INTO "admin_tab" ("id", "label", "icon", "component") VALUES ${values} ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const ids = STATIC_TABS.map((tab) => `'${tab.id}'`).join(',');

    if (!ids) {
      return;
    }

    await queryRunner.query(
      `DELETE FROM "admin_tab" WHERE "id" IN (${ids})`,
    );
  }
}
