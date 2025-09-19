import { MigrationInterface, QueryRunner } from 'typeorm';

export class TournamentDetails1757400000000 implements MigrationInterface {
  name = 'TournamentDetails1757400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tournament_details_type_enum" AS ENUM('overview', 'structure', 'prizes')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tournament_details" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tournament_id" uuid NOT NULL,
        "type" "public"."tournament_details_type_enum" NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        CONSTRAINT "PK_tournament_details_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tournament_details_tournament" ON "tournament_details" ("tournament_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tournament_details_type" ON "tournament_details" ("type")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_details"
        ADD CONSTRAINT "FK_tournament_details_tournament"
        FOREIGN KEY ("tournament_id")
        REFERENCES "tournament"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournament_details" DROP CONSTRAINT "FK_tournament_details_tournament"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tournament_details_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tournament_details_tournament"`,
    );
    await queryRunner.query(`DROP TABLE "tournament_details"`);
    await queryRunner.query(`DROP TYPE "public"."tournament_details_type_enum"`);
  }
}
