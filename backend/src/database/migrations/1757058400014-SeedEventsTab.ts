import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEventsTab1757058400014 implements MigrationInterface {
  name = 'SeedEventsTab1757058400014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "admin_tab"("id","label","icon","component") VALUES ('events','Events','faBell','@/app/components/dashboard/AdminEvents') ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "admin_tab" WHERE "id" = 'events'`);
  }
}
