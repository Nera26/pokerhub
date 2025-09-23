import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromotionClaims1757800000000 implements MigrationInterface {
  name = 'PromotionClaims1757800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "promotion_claims" (
        "promotionId" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "claimedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promotion_claims" PRIMARY KEY ("promotionId", "userId"),
        CONSTRAINT "FK_promotion_claims_promotion" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "promotion_claims"');
  }
}
