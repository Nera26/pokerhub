import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTableTheme1757058400004 implements MigrationInterface {
  name = 'SeedTableTheme1757058400004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "table_theme" ("hairline", "positions") VALUES ($1, $2)`,
      [
        'var(--color-hairline)',
        JSON.stringify({
          BTN: {
            color: 'hsl(44,88%,60%)',
            glow: 'hsla(44,88%,60%,0.45)',
            badge: '/badges/btn.svg',
          },
          SB: {
            color: 'hsl(202,90%,60%)',
            glow: 'hsla(202,90%,60%,0.45)',
            badge: '/badges/sb.svg',
          },
          BB: {
            color: 'hsl(275,85%,65%)',
            glow: 'hsla(275,85%,65%,0.45)',
            badge: '/badges/bb.svg',
          },
          UTG: { color: 'var(--color-pos-utg)', glow: 'var(--glow-pos-utg)' },
          MP: { color: 'var(--color-pos-mp)', glow: 'var(--glow-pos-mp)' },
          CO: { color: 'var(--color-pos-co)', glow: 'var(--glow-pos-co)' },
          HJ: { color: 'var(--color-pos-hj)', glow: 'var(--glow-pos-hj)' },
          LJ: { color: 'var(--color-pos-lj)', glow: 'var(--glow-pos-lj)' },
        }),
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "table_theme"`);
  }
}
