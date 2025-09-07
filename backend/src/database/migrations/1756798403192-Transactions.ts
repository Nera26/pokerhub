import { MigrationInterface, QueryRunner } from 'typeorm';

export class Transactions1756798403192 implements MigrationInterface {
  name = 'Transactions1756798403192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transaction_type" ("id" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "PK_transaction_type" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallet_transaction" ("id" uuid NOT NULL, "userId" character varying NOT NULL, "typeId" character varying NOT NULL, "amount" integer NOT NULL, "performedBy" character varying NOT NULL, "notes" character varying NOT NULL, "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_wallet_transaction" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transaction" ADD CONSTRAINT "FK_wallet_transaction_type" FOREIGN KEY ("typeId") REFERENCES "transaction_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "transaction_type"(id,label) VALUES ('admin-add','Admin Add'),('admin-remove','Admin Remove'),('withdrawal','Withdrawal'),('deposit','Deposit'),('bonus','Bonus'),('game-buy-in','Game Buy-in'),('winnings','Winnings')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallet_transaction" DROP CONSTRAINT "FK_wallet_transaction_type"`,
    );
    await queryRunner.query(`DROP TABLE "wallet_transaction"`);
    await queryRunner.query(`DROP TABLE "transaction_type"`);
  }
}
