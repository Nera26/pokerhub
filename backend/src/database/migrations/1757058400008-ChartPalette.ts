import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChartPalette1757058400008 implements MigrationInterface {
  name = 'ChartPalette1757058400008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chart_palette" ("id" SERIAL NOT NULL, "color" character varying NOT NULL, CONSTRAINT "PK_chart_palette" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "chart_palette"`);
  }
}
