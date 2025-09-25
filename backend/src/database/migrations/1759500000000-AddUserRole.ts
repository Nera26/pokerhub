import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1759500000000 implements MigrationInterface {
  name = 'AddUserRole1759500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE \"user\" ADD \"role\" character varying NOT NULL DEFAULT 'Player'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "role"');
  }
}
