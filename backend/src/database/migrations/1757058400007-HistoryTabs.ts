import { MigrationInterface, QueryRunner } from 'typeorm';

export class HistoryTabs1757058400007 implements MigrationInterface {
  name = 'HistoryTabs1757058400007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "history_tab" ("id" SERIAL NOT NULL, "key" character varying NOT NULL, "label" character varying NOT NULL, "order" integer NOT NULL, CONSTRAINT "UQ_history_tab_key" UNIQUE ("key"), CONSTRAINT "PK_history_tab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "history_tab"("key","label","order") VALUES
        ('game-history','Game History',1),
        ('tournament-history','Tournament History',2),
        ('transaction-history','Deposit/Withdraw',3)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "history_tab"`);
  }
}
