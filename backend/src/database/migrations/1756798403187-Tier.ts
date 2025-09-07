import { MigrationInterface, QueryRunner } from 'typeorm';

export class Tier1756798403187 implements MigrationInterface {
  name = 'Tier1756798403187';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tier" ("name" character varying NOT NULL, "min" integer NOT NULL, "max" integer, CONSTRAINT "PK_tier_name" PRIMARY KEY ("name"))`,
    );
    await queryRunner.query(
      `INSERT INTO "tier" ("name", "min", "max") VALUES
        ('Bronze', 0, 999),
        ('Silver', 1000, 4999),
        ('Gold', 5000, 9999),
        ('Diamond', 10000, 19999),
        ('Platinum', 20000, NULL)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tier"`);
  }
}
