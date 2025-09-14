import { MigrationInterface, QueryRunner } from 'typeorm';
import icons from '../seeds/nav-icons.json';

export class NavIcons1757058400005 implements MigrationInterface {
  name = 'NavIcons1757058400005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nav_icons" ("name" character varying NOT NULL, "svg" text NOT NULL, CONSTRAINT "PK_nav_icons_name" PRIMARY KEY ("name"))`,
    );


    const values = icons
      .map((_, i) => `($${2 * i + 1}, $${2 * i + 2})`)
      .join(', ');
    await queryRunner.query(
      `INSERT INTO "nav_icons" ("name", "svg") VALUES ${values}`,
      icons.flatMap((i) => [i.name, i.svg]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nav_icons"`);
  }
}
