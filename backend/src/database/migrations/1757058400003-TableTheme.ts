import { MigrationInterface, QueryRunner } from 'typeorm';

export class TableTheme1757058400003 implements MigrationInterface {
  name = 'TableTheme1757058400003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "table_theme" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "backgroundColor" character varying, "feltColor" character varying, CONSTRAINT "UQ_table_theme_name" UNIQUE ("name"), CONSTRAINT "PK_table_theme" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "table_theme"`);
  }
}
