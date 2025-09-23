import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEventsTab1757058400014 implements MigrationInterface {
  name = 'SeedEventsTab1757058400014';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: canonical admin tabs are seeded by 1757600000001-SeedAdminSidebarTabs.
  }
}
