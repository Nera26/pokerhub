import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameState1700000006000 implements MigrationInterface {
  name = 'GameState1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "game_state" ("id" SERIAL NOT NULL, "tableId" character varying NOT NULL, "tick" integer NOT NULL, "state" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_game_state_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_game_state_table" ON "game_state" ("tableId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_game_state_table"`);
    await queryRunner.query(`DROP TABLE "game_state"`);
  }
}
