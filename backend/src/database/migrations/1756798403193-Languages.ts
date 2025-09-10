import { MigrationInterface, QueryRunner } from 'typeorm';

export class Languages1756798403193 implements MigrationInterface {
  name = 'Languages1756798403193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "languages" ("code" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "PK_languages_code" PRIMARY KEY ("code"))`,
    );
    await queryRunner.query(
      `INSERT INTO "languages" ("code", "label") VALUES ('en', 'English'), ('es', 'Español')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "languages"`);
  }
}
