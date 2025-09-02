import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountCreditBalance1700000007000 implements MigrationInterface {
  name = 'AccountCreditBalance1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "creditBalance" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "creditBalance"`,
    );
  }
}
