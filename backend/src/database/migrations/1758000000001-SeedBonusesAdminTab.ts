import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBonusesAdminTab1758000000001 implements MigrationInterface {
  name = 'SeedBonusesAdminTab1758000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "admin_tab"("id","label","icon","component") VALUES ('bonuses','Bonuses','faGift','@/app/components/dashboard/BonusManager') ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "admin_tab" WHERE "id" = 'bonuses'`);
  }
}
