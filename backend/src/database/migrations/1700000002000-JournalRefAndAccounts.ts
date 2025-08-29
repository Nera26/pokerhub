import { MigrationInterface, QueryRunner } from 'typeorm';

export class JournalRefAndAccounts1700000002000 implements MigrationInterface {
  name = 'JournalRefAndAccounts1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journal_entry" ADD "refType" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" ADD "refId" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" ADD "hash" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" ADD CONSTRAINT "UQ_journal_entry_hash" UNIQUE ("hash")`
    );
    await queryRunner.query(
      `INSERT INTO "account"("id","name","currency","balance") VALUES ('00000000-0000-0000-0000-000000000003','rake','USD',0),('00000000-0000-0000-0000-000000000004','prize','USD',0)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "account" WHERE "name" IN ('rake','prize')`
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" DROP CONSTRAINT "UQ_journal_entry_hash"`
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" DROP COLUMN "hash"`
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" DROP COLUMN "refId"`
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entry" DROP COLUMN "refType"`
    );
  }
}
