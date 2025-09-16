import { MigrationInterface, QueryRunner } from 'typeorm';

export class NavItems1757058400013 implements MigrationInterface {
  name = 'NavItems1757058400013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nav_items" ("flag" character varying NOT NULL, "href" character varying NOT NULL, "label" character varying NOT NULL, "icon" character varying, "order" integer NOT NULL, CONSTRAINT "PK_nav_items_flag" PRIMARY KEY ("flag"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nav_items"`);
  }
}
