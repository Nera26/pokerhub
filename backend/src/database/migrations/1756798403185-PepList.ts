import { MigrationInterface, QueryRunner } from 'typeorm';

export class PepList1756798403185 implements MigrationInterface {
  name = 'PepList1756798403185';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pep_list" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, CONSTRAINT "UQ_pep_list_name" UNIQUE ("name"), CONSTRAINT "PK_pep_list_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "pep_list" ("name") VALUES ('famous politician'), ('corrupt mayor')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pep_list"`);
  }
}
