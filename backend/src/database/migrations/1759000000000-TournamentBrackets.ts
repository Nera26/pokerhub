import { MigrationInterface, QueryRunner } from 'typeorm';

export class TournamentBrackets1759000000000 implements MigrationInterface {
  name = 'TournamentBrackets1759000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tournament_bracket" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tournament_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "rounds" jsonb NOT NULL DEFAULT '[]',
        CONSTRAINT "PK_tournament_bracket" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tournament_bracket_tournament_id" UNIQUE ("tournament_id"),
        CONSTRAINT "FK_tournament_bracket_tournament" FOREIGN KEY ("tournament_id") REFERENCES "tournament_history"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_tournament_bracket_user_id" ON "tournament_bracket" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tournament_bracket_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "tournament_bracket"`);
  }
}
