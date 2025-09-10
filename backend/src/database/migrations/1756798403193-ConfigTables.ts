import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConfigTables1756798403193 implements MigrationInterface {
  name = 'ConfigTables1756798403193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chip_denomination" ("id" SERIAL NOT NULL, "value" integer NOT NULL, CONSTRAINT "PK_chip_denomination_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "table_theme" ("id" SERIAL NOT NULL, "hairline" character varying NOT NULL, "positions" jsonb NOT NULL, CONSTRAINT "PK_table_theme_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "chip_denomination" ("value") VALUES (1000), (100), (25)`,
    );
    await queryRunner.query(
      `INSERT INTO "table_theme" ("hairline", "positions") VALUES ('var(--color-hairline)','{"BTN":{"color":"hsl(44,88%,60%)","glow":"hsla(44,88%,60%,0.45)","badge":"/badges/btn.svg"},"SB":{"color":"hsl(202,90%,60%)","glow":"hsla(202,90%,60%,0.45)","badge":"/badges/sb.svg"},"BB":{"color":"hsl(275,85%,65%)","glow":"hsla(275,85%,65%,0.45)","badge":"/badges/bb.svg"},"UTG":{"color":"var(--color-pos-utg)","glow":"var(--glow-pos-utg)"},"MP":{"color":"var(--color-pos-mp)","glow":"var(--glow-pos-mp)"},"CO":{"color":"var(--color-pos-co)","glow":"var(--glow-pos-co)"},"HJ":{"color":"var(--color-pos-hj)","glow":"var(--glow-pos-hj)"},"LJ":{"color":"var(--color-pos-lj)","glow":"var(--glow-pos-lj)"}}')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "table_theme"`);
    await queryRunner.query(`DROP TABLE "chip_denomination"`);
  }
}
