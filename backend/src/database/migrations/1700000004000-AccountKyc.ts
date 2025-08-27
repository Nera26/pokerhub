import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountKyc1700000004000 implements MigrationInterface {
  name = 'AccountKyc1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "kycVerified" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "kycVerified"`);
  }
}
