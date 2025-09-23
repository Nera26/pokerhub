import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBonusesAdminTab1758000000001 implements MigrationInterface {
  name = 'SeedBonusesAdminTab1758000000001';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }
}
