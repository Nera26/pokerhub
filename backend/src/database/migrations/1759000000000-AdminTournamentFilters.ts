import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_ADMIN_TOURNAMENT_FILTERS } from '../../tournament/admin-tournament-filter.defaults';

export class AdminTournamentFilters1759000000000 implements MigrationInterface {
  name = 'AdminTournamentFilters1759000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin_tournament_filters" ("id" character varying NOT NULL, "label" character varying NOT NULL, "color_class" character varying, "sort_order" integer NOT NULL, CONSTRAINT "PK_admin_tournament_filters_id" PRIMARY KEY ("id"))`,
    );

    const values = DEFAULT_ADMIN_TOURNAMENT_FILTERS.map((filter, index) => (
      `('${filter.id}', '${filter.label.replace(/'/g, "''")}', ${filter.colorClass ? `'${filter.colorClass.replace(/'/g, "''")}'` : 'NULL'}, ${index + 1})`
    ));

    if (values.length) {
      await queryRunner.query(
        `INSERT INTO "admin_tournament_filters" ("id", "label", "color_class", "sort_order") VALUES ${values.join(', ')}`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "admin_tournament_filters"');
  }
}
