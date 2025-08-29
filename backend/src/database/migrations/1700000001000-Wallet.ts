import { MigrationInterface, QueryRunner } from 'typeorm';

export class Wallet1700000001000 implements MigrationInterface {
  name = 'Wallet1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "account" ("id" uuid NOT NULL, "name" character varying NOT NULL, "currency" character varying(3) NOT NULL, "balance" integer NOT NULL DEFAULT 0, CONSTRAINT "UQ_account_name_currency" UNIQUE ("name","currency"), CONSTRAINT "PK_account" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "journal_entry" ("id" uuid NOT NULL, "accountId" uuid NOT NULL, "amount" integer NOT NULL, "currency" character varying(3) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_journal_entry" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" ADD CONSTRAINT "FK_journal_account" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "account"("id","name","currency","balance") VALUES ('00000000-0000-0000-0000-000000000001','reserve','USD',0),('00000000-0000-0000-0000-000000000002','house','USD',0)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journal_entry" DROP CONSTRAINT "FK_journal_account"`,
    );
    await queryRunner.query(`DROP TABLE "journal_entry"`);
    await queryRunner.query(`DROP TABLE "account"`);
  }
}
