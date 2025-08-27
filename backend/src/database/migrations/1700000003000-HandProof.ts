import { MigrationInterface, QueryRunner } from 'typeorm';

export class HandProof1700000003000 implements MigrationInterface {
  name = 'HandProof1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hand" ("id" uuid NOT NULL, "log" text NOT NULL, "commitment" character varying NOT NULL, "seed" character varying, "nonce" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_hand" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hand"`);
  }
}
