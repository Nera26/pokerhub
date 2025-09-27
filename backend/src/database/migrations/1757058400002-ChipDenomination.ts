import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChipDenomination1757058400002 implements MigrationInterface {
  name = 'ChipDenomination1757058400002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('chip_denomination');
    if (hasTable) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "chip_denomination" ("id" SERIAL NOT NULL, "value" integer NOT NULL, "color" character varying NOT NULL, CONSTRAINT "UQ_chip_denomination_value" UNIQUE ("value"), CONSTRAINT "PK_chip_denomination" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chip_denomination"`);
  }
}
