import { MigrationInterface, QueryRunner } from 'typeorm';

export class TournamentFilterOptions1757058400016
  implements MigrationInterface
{
  name = 'TournamentFilterOptions1757058400016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tournament_filter_options" ("value" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "PK_tournament_filter_options_value" PRIMARY KEY ("value"))`,
    );
    await queryRunner.query(
      `INSERT INTO "tournament_filter_options" ("value", "label") VALUES
        ('active', 'Active'),
        ('upcoming', 'Upcoming'),
        ('past', 'Past')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tournament_filter_options"`);
  }
}
