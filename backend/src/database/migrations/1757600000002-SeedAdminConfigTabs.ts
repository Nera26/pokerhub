import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAdminConfigTabs1757600000002 implements MigrationInterface {
  name = 'SeedAdminConfigTabs1757600000002';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }
}
