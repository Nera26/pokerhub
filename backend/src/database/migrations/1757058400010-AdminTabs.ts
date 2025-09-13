import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminTabs1757058400010 implements MigrationInterface {
  name = 'AdminTabs1757058400010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin_tab" ("id" character varying NOT NULL, "label" character varying NOT NULL, "icon" character varying NOT NULL, "component" character varying NOT NULL, CONSTRAINT "PK_admin_tab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "admin_tab"("id","label","icon","component") VALUES
        ('users','Users','faUsers','@/app/components/dashboard/ManageUsers'),
        ('tables','Tables','faTable','@/app/components/dashboard/ManageTables'),
        ('tournaments','Tournaments','faTrophy','@/app/components/dashboard/ManageTournaments')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_tab"`);
  }
}
