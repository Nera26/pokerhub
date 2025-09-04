import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingDepositExpiresAt1756798403184 implements MigrationInterface {
  name = 'PendingDepositExpiresAt1756798403184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pending_deposit" ADD "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pending_deposit" DROP COLUMN "expiresAt"`
    );
  }
}
