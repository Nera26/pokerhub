import { MigrationInterface, QueryRunner } from 'typeorm';

export class BonusDefaults1758300000000 implements MigrationInterface {
  name = 'BonusDefaults1758300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bonus_default" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "description" text NOT NULL, "bonusPercent" double precision, "maxBonusUsd" double precision, "expiryDate" date, "eligibility" character varying NOT NULL, "status" character varying NOT NULL, CONSTRAINT "PK_bonus_default_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "bonus_default" ("name", "type", "description", "bonusPercent", "maxBonusUsd", "expiryDate", "eligibility", "status") VALUES ('', 'deposit', '', NULL, NULL, NULL, 'all', 'active')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bonus_default"`);
  }
}
