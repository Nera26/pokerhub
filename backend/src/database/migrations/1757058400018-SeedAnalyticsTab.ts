import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAnalyticsTab1757058400018 implements MigrationInterface {
  name = 'SeedAnalyticsTab1757058400018';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }
}
