import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueUsername1756798403183 implements MigrationInterface {
  name = 'UniqueUsername1756798403183';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_username" UNIQUE ("username")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_username"`,
    );
  }
}
