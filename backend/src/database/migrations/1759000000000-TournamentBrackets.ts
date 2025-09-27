import { MigrationInterface, QueryRunner } from 'typeorm';

export class TournamentBrackets1759000000000 implements MigrationInterface {
  name = 'TournamentBrackets1759000000000';

  private async indexExists(queryRunner: QueryRunner, table: string, index: string): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1 AND indexname = $2 LIMIT 1`,
      [table, index]
    );
    return result.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTournamentHistory = await queryRunner.hasTable('tournament_history');
    if (!hasTournamentHistory) {
      await queryRunner.query(`
        CREATE TABLE "tournament_history" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying NOT NULL,
          "place" character varying NOT NULL,
          "buyin" character varying NOT NULL,
          "prize" character varying NOT NULL,
          "duration" character varying NOT NULL,
          CONSTRAINT "PK_tournament_history" PRIMARY KEY ("id")
        )
      `);
    }

    const hasBracketTable = await queryRunner.hasTable('tournament_bracket');
    if (hasBracketTable) {
      const indexExists = await this.indexExists(queryRunner, 'tournament_bracket', 'IDX_tournament_bracket_user_id');
      if (!indexExists) {
        await queryRunner.query(
          `CREATE INDEX "IDX_tournament_bracket_user_id" ON "tournament_bracket" ("user_id")`
        );
      }
      return;
    }

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
      `CREATE INDEX "IDX_tournament_bracket_user_id" ON "tournament_bracket" ("user_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasBracketTable = await queryRunner.hasTable('tournament_bracket');
    if (hasBracketTable) {
      const indexExists = await this.indexExists(queryRunner, 'tournament_bracket', 'IDX_tournament_bracket_user_id');
      if (indexExists) {
        await queryRunner.query(`DROP INDEX "public"."IDX_tournament_bracket_user_id"`);
      }
      await queryRunner.query(`DROP TABLE "tournament_bracket"`);
    }
  }
}
