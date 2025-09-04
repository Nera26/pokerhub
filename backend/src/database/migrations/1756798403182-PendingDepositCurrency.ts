import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingDepositCurrency1756798403182 implements MigrationInterface {
  name = 'PendingDepositCurrency1756798403182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pending_deposit" ADD "currency" character varying(3) NOT NULL DEFAULT 'USD'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pending_deposit" DROP COLUMN "currency"`);
  }
}
