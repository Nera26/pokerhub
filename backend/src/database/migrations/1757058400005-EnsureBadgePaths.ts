import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureBadgePaths1757058400005 implements MigrationInterface {
  name = 'EnsureBadgePaths1757058400005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "table_theme"
       SET "positions" = jsonb_set(
         jsonb_set(
           jsonb_set("positions", '{BTN,badge}', '"/badges/btn.svg"'::jsonb, true),
           '{SB,badge}', '"/badges/sb.svg"'::jsonb, true
         ),
         '{BB,badge}', '"/badges/bb.svg"'::jsonb, true
       )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "table_theme"
       SET "positions" = "positions" #- '{BTN,badge}' #- '{SB,badge}' #- '{BB,badge}'`,
    );
  }
}
