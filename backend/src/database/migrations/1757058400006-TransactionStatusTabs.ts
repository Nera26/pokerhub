import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionStatusTabs1757058400006
  implements MigrationInterface
{
  name = 'TransactionStatusTabs1757058400006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transaction_status" ("id" character varying NOT NULL, "label" character varying NOT NULL, "style" character varying NOT NULL, CONSTRAINT "PK_transaction_status" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transaction_tab" ("id" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "PK_transaction_tab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "transaction_status"(id,label,style) VALUES
        ('pending','Pending','bg-accent-yellow/20 text-accent-yellow'),
        ('confirmed','Completed','bg-accent-green/20 text-accent-green'),
        ('rejected','Rejected','bg-danger-red/20 text-danger-red'),
        ('Pending','Pending','bg-accent-yellow/20 text-accent-yellow'),
        ('Completed','Completed','bg-accent-green/20 text-accent-green'),
        ('Rejected','Rejected','bg-danger-red/20 text-danger-red'),
        ('Failed','Failed','bg-danger-red/20 text-danger-red'),
        ('Processing','Processing','bg-accent-yellow/20 text-accent-yellow'),
        ('Pending Confirmation','Pending Confirmation','bg-accent-yellow/20 text-accent-yellow')`,
    );
    await queryRunner.query(
      `INSERT INTO "transaction_tab"(id,label) VALUES ('all','All'),('deposits','Deposits'),('withdrawals','Withdrawals'),('manual','Manual Adjustments')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transaction_tab"`);
    await queryRunner.query(`DROP TABLE "transaction_status"`);
  }
}
