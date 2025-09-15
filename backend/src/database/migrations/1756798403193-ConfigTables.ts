import { MigrationInterface, QueryRunner } from 'typeorm';
import tableTheme from '@shared/config/tableTheme.json' assert { type: 'json' };

export class ConfigTables1756798403193 implements MigrationInterface {
  name = 'ConfigTables1756798403193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chip_denomination" ("id" SERIAL NOT NULL, "value" integer NOT NULL, CONSTRAINT "PK_chip_denomination_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "table_theme" ("id" SERIAL NOT NULL, "hairline" character varying NOT NULL, "positions" jsonb NOT NULL, CONSTRAINT "PK_table_theme_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "chip_denomination" ("value") VALUES (1000), (100), (25)`,
    );
    await queryRunner.query(
      `INSERT INTO "table_theme" ("hairline", "positions") VALUES ($1, $2)`,
      [tableTheme.hairline, JSON.stringify(tableTheme.positions)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "table_theme"`);
    await queryRunner.query(`DROP TABLE "chip_denomination"`);
  }
}
