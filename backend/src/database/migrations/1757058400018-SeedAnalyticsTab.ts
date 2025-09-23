import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAnalyticsTab1757058400018 implements MigrationInterface {
  name = 'SeedAnalyticsTab1757058400018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "admin_tab"("id","label","icon","component") VALUES ('analytics','Analytics','faChartLine','@/app/components/dashboard/analytics/Analytics') ON CONFLICT ("id") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "admin_tab"("id","label","icon","component") VALUES ('wallet-iban','Wallet IBAN','faUniversity','@/app/components/dashboard/IbanManager') ON CONFLICT ("id") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "admin_tab" WHERE "id" = 'analytics'`);
    await queryRunner.query(`DELETE FROM "admin_tab" WHERE "id" = 'wallet-iban'`);
  }
}
