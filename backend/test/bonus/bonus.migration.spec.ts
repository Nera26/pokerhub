import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { BonusEntity } from '../../src/database/entities/bonus.entity';
import { Bonuses1757300000000 } from '../../src/database/migrations/1757300000000-Bonuses';

describe('Bonus migrations', () => {
  it('creates the bonus table with defaults', async () => {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });

    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [BonusEntity],
      migrations: [Bonuses1757300000000],
    }) as DataSource;

    await dataSource.initialize();

    try {
      await dataSource.runMigrations();

      const repository = dataSource.getRepository(BonusEntity);
      const created = await repository.save({
        name: 'Launch Bonus',
        type: 'deposit',
        description: 'desc',
        eligibility: 'all',
        status: 'active',
      });

      expect(created.claimsTotal).toBe(0);
      expect(created.claimsWeek).toBe(0);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  });
});
