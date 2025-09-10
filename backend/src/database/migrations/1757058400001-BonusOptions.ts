import { MigrationInterface, QueryRunner } from 'typeorm';

export class BonusOptions1757058400001 implements MigrationInterface {
  name = 'BonusOptions1757058400001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bonus_option" ("id" SERIAL NOT NULL, "type" character varying, "eligibility" character varying, "status" character varying, "label" character varying NOT NULL, CONSTRAINT "PK_bonus_option" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "bonus_option"(type,label) VALUES ('deposit','Deposit Match'),('rakeback','Rakeback'),('ticket','Tournament Tickets'),('rebate','Rebate'),('first-deposit','First Deposit Only')`,
    );
    await queryRunner.query(
      `INSERT INTO "bonus_option"(eligibility,label) VALUES ('all','All Players'),('new','New Players Only'),('vip','VIP Players Only'),('active','Active Players')`,
    );
    await queryRunner.query(
      `INSERT INTO "bonus_option"(status,label) VALUES ('active','Active'),('paused','Paused')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bonus_option"`);
  }
}
