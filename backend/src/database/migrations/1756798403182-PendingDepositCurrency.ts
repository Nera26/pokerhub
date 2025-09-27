import { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingDepositCurrency1756798403182 implements MigrationInterface {
  name = 'PendingDepositCurrency1756798403182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('pending_deposit');

    if (!hasTable) {
      await queryRunner.query(`
        CREATE TABLE "pending_deposit" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "userId" character varying NOT NULL,
          "amount" integer NOT NULL,
          "currency" character varying(3) NOT NULL DEFAULT 'USD',
          "reference" character varying NOT NULL,
          "status" character varying NOT NULL DEFAULT 'pending',
          "actionRequired" boolean NOT NULL DEFAULT false,
          "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "confirmedBy" character varying,
          "confirmedAt" TIMESTAMP WITH TIME ZONE,
          "rejectedBy" character varying,
          "rejectedAt" TIMESTAMP WITH TIME ZONE,
          "rejectionReason" character varying,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_pending_deposit" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_pending_deposit_reference" UNIQUE ("reference")
        )
      `);
      return;
    }

    const hasCurrency = await queryRunner.hasColumn('pending_deposit', 'currency');
    if (!hasCurrency) {
      await queryRunner.query(
        `ALTER TABLE "pending_deposit" ADD "currency" character varying(3) NOT NULL DEFAULT 'USD'`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('pending_deposit');
    if (!hasTable) {
      return;
    }

    const hasCurrency = await queryRunner.hasColumn('pending_deposit', 'currency');
    if (hasCurrency) {
      await queryRunner.query(`ALTER TABLE "pending_deposit" DROP COLUMN "currency"`);
    }
  }
}
