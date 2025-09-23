import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  applyCanonicalAdminSidebarTabs,
  removeCanonicalAdminSidebarTabs,
} from '../seeds/admin-sidebar-tabs';

export class AlignAdminSidebarTabs1758300000000 implements MigrationInterface {
  name = 'AlignAdminSidebarTabs1758300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await applyCanonicalAdminSidebarTabs(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await removeCanonicalAdminSidebarTabs(queryRunner);
  }
}
