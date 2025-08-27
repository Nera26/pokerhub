import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1700000000000 implements MigrationInterface {
  name = 'Init1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tournament" ("id" uuid NOT NULL, "title" character varying NOT NULL, CONSTRAINT "PK_tournament" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "table" ("id" uuid NOT NULL, "name" character varying NOT NULL, "tournamentId" uuid, CONSTRAINT "PK_table" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL, "username" character varying NOT NULL, CONSTRAINT "PK_user" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "table_players_user" ("tableId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_table_players" PRIMARY KEY ("tableId", "userId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "table" ADD CONSTRAINT "FK_table_tournament" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_players_user" ADD CONSTRAINT "FK_table_players_table" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_players_user" ADD CONSTRAINT "FK_table_players_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "table_players_user" DROP CONSTRAINT "FK_table_players_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "table_players_user" DROP CONSTRAINT "FK_table_players_table"`,
    );
    await queryRunner.query(
      `ALTER TABLE "table" DROP CONSTRAINT "FK_table_tournament"`,
    );
    await queryRunner.query(`DROP TABLE "table_players_user"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "table"`);
    await queryRunner.query(`DROP TABLE "tournament"`);
  }
}
