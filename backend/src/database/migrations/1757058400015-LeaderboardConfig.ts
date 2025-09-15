import { MigrationInterface, QueryRunner } from 'typeorm';

export class LeaderboardConfig1757058400015 implements MigrationInterface {
  name = 'LeaderboardConfig1757058400015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "leaderboard_config" ("range" character varying NOT NULL, "mode" character varying NOT NULL, CONSTRAINT "PK_leaderboard_config" PRIMARY KEY ("range", "mode"))`,
    );
    await queryRunner.query(
      `INSERT INTO "leaderboard_config" ("range", "mode") VALUES
        ('daily', 'cash'),
        ('weekly', 'cash'),
        ('monthly', 'cash'),
        ('daily', 'tournament'),
        ('weekly', 'tournament'),
        ('monthly', 'tournament')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "leaderboard_config"`);
  }
}
