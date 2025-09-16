import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlockedCountries1757058400012 implements MigrationInterface {
  name = 'BlockedCountries1757058400012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blocked_countries" ("country" character varying NOT NULL, CONSTRAINT "PK_blocked_countries_country" PRIMARY KEY ("country"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "blocked_countries"`);
  }
}
