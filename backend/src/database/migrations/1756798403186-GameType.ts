import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameType1756798403186 implements MigrationInterface {
  name = 'GameType1756798403186';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "game_type" ("id" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "PK_game_type_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "game_type" ("id", "label") VALUES
        ('texas', 'Texas Hold''em'),
        ('omaha', 'Omaha'),
        ('allin', 'All-in or Fold'),
        ('tournaments', 'Tournaments')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "game_type"`);
  }
}
