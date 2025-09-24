import { MigrationInterface, QueryRunner } from 'typeorm';

export class TournamentFormats1758700000000 implements MigrationInterface {
  name = 'TournamentFormats1758700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tournament_formats" ("id" character varying NOT NULL, "label" character varying NOT NULL, "sort_order" integer NOT NULL, CONSTRAINT "PK_tournament_formats_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "tournament_formats" ("id", "label", "sort_order") VALUES
        ('Regular', 'Regular', 1),
        ('Turbo', 'Turbo', 2),
        ('Deepstack', 'Deepstack', 3),
        ('Bounty', 'Bounty', 4),
        ('Freeroll', 'Freeroll', 5)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "tournament_formats"');
  }
}
