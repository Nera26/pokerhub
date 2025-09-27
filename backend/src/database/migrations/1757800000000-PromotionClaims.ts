import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromotionClaims1757800000000 implements MigrationInterface {
  name = 'PromotionClaims1757800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasPromotions = await queryRunner.hasTable('promotions');
    if (!hasPromotions) {
      await queryRunner.query(`
        CREATE TABLE "promotions" (
          "id" character varying NOT NULL,
          "category" character varying NOT NULL,
          "title" character varying NOT NULL,
          "description" character varying NOT NULL,
          "reward" character varying NOT NULL,
          "unlockText" character varying,
          "statusText" character varying,
          "progress" json,
          "breakdown" json NOT NULL,
          "eta" character varying,
          CONSTRAINT "PK_promotions" PRIMARY KEY ("id")
        )
      `);
    }

    const hasPromotionClaims = await queryRunner.hasTable('promotion_claims');
    if (hasPromotionClaims) {
      return;
    }

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
    const hasPromotionClaims = await queryRunner.hasTable('promotion_claims');
    if (hasPromotionClaims) {
      await queryRunner.query('DROP TABLE "promotion_claims"');
    }
  }
}
