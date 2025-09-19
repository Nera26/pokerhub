import { MigrationInterface, QueryRunner } from 'typeorm';

export class Bonuses1757300000000 implements MigrationInterface {
  name = 'Bonuses1757300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bonus" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "description" text NOT NULL,
        "bonusPercent" double precision,
        "maxBonusUsd" double precision,
        "expiryDate" date,
        "eligibility" character varying NOT NULL,
        "status" character varying NOT NULL,
        "claimsTotal" integer NOT NULL DEFAULT 0,
        "claimsWeek" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_bonus" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "bonus"');
  }
}
