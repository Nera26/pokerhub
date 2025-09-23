import { MigrationInterface, QueryRunner } from 'typeorm';

export class PerformanceThresholds1758200000000
  implements MigrationInterface
{
  name = 'PerformanceThresholds1758200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "performance_threshold" (
        "metric" character varying NOT NULL,
        "value" double precision NOT NULL,
        CONSTRAINT "PK_performance_threshold_metric" PRIMARY KEY ("metric")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "performance_threshold"');
  }
}
