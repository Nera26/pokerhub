import { MigrationInterface, QueryRunner } from 'typeorm';

export class NavItems1757058400013 implements MigrationInterface {
  name = 'NavItems1757058400013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "nav_items" ("flag" character varying NOT NULL, "href" character varying NOT NULL, "label" character varying NOT NULL, "icon" character varying, "order" integer NOT NULL, CONSTRAINT "PK_nav_items_flag" PRIMARY KEY ("flag"))`,
    );
    await queryRunner.query(
      `INSERT INTO "nav_items" ("flag", "href", "label", "icon", "order") VALUES
        ('lobby', '/', 'Lobby', 'home', 1),
        ('wallet', '/wallet', 'Wallet', 'wallet', 2),
        ('promotions', '/promotions', 'Promotions', 'tags', 3),
        ('leaderboard', '/leaderboard', 'Leaderboard', 'trophy', 4),
        ('notifications', '/notifications', 'Alerts', 'bell', 5),
        ('profile', '/user', 'Profile', NULL, 6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nav_items"`);
  }
}
