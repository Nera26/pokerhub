import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUserBalance1700000003000 implements MigrationInterface {
  name = 'RemoveUserBalance1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "balance"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "balance" integer NOT NULL DEFAULT 0`
    );
  }
}
