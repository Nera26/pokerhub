import { MigrationInterface, QueryRunner } from 'typeorm';

export class NavIcons1757058400005 implements MigrationInterface {
  name = 'NavIcons1757058400005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nav_icons" ("name" character varying NOT NULL, "svg" text NOT NULL, CONSTRAINT "PK_nav_icons_name" PRIMARY KEY ("name"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nav_icons"`);
  }
}
