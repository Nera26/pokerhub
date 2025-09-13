import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedChartPalette1757058400009 implements MigrationInterface {
  name = 'SeedChartPalette1757058400009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "chart_palette" ("color") VALUES ($1),($2),($3),($4)`,
      ['#ff4d4f', '#facc15', '#3b82f6', '#22c55e'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "chart_palette"`);
  }
}
