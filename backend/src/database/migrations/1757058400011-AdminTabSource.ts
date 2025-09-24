import { MigrationInterface, QueryRunner } from 'typeorm';

const CONFIG_TAB_IDS = [
  'analytics',
  'broadcast',
  'bonuses',
  'deposits-reconcile',
  'events',
  'feature-flags',
  'settings',
  'tables',
  'transactions',
  'tournaments',
  'users',
  'wallet-iban',
  'wallet-reconcile',
  'wallet-withdrawals',
  'collusion',
];

export class AdminTabSource1757058400011 implements MigrationInterface {
  name = 'AdminTabSource1757058400011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "admin_tab" ADD "source" character varying NOT NULL DEFAULT \'database\'',
    );
    const placeholders = CONFIG_TAB_IDS.map((_, index) => `$${index + 1}`).join(',');
    await queryRunner.query(
      `UPDATE "admin_tab" SET "source" = 'config' WHERE "id" IN (${placeholders})`,
      CONFIG_TAB_IDS,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "admin_tab" DROP COLUMN "source"');
  }
}
