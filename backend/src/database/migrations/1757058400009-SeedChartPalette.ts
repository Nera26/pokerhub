import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_PALETTE =
  process.env.DEFAULT_CHART_PALETTE?.split(',').filter(Boolean) ?? [];

export class SeedChartPalette1757058400009 implements MigrationInterface {
  name = 'SeedChartPalette1757058400009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (DEFAULT_PALETTE.length === 0) {
      return;
    }
    const placeholders = DEFAULT_PALETTE.map((_, i) => `($${i + 1})`).join(',');
    await queryRunner.query(
      `INSERT INTO "chart_palette" ("color") VALUES ${placeholders}`,
      DEFAULT_PALETTE,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "chart_palette"`);
  }
}
