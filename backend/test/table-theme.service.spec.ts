import { TableThemeService } from '../src/services/table-theme.service';
import { TableThemeEntity } from '../src/database/entities/table-theme.entity';
import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import type { Repository } from 'typeorm';
import {
  ConfigTables1756798403193,
  TABLE_THEME_SEED,
} from '../src/database/migrations/1756798403193-ConfigTables';
import type { TableThemeResponse } from '@shared/types';

describe('TableThemeService', () => {
  let entity: TableThemeEntity | null;
  let repo: Partial<Repository<TableThemeEntity>>;
  let service: TableThemeService;
  const customTheme: TableThemeResponse = {
    hairline: 'var(--color-hairline)',
    positions: {
      BTN: {
        color: 'hsl(44,88%,60%)',
        glow: 'hsla(44,88%,60%,0.45)',
        badge: '/badges/btn.svg',
      },
    },
  };
  const defaultTheme: TableThemeResponse = {
    hairline: 'var(--color-hairline)',
    positions: {},
  };

  beforeEach(() => {
    entity = null;
    repo = {
      findOne: jest.fn(async () => entity),
      create: jest.fn((data) => data as TableThemeEntity),
      save: jest.fn(async (data) => {
        entity = { id: 1, ...data } as TableThemeEntity;
        return entity;
      }),
    };
    service = new TableThemeService(repo as Repository<TableThemeEntity>);
  });

  it('throws when no theme exists', async () => {
    await expect(service.get()).rejects.toThrow('Table theme not found');
  });

  it('creates and updates theme', async () => {
    const created = await service.update(customTheme);
    expect(created).toEqual(customTheme);
    expect(await service.get()).toEqual(customTheme);

    const res = await service.update({ hairline: undefined as any, positions: undefined as any });
    expect(res).toEqual(defaultTheme);
    expect(await service.get()).toEqual(defaultTheme);
  });
});

describe('TableThemeService migrations', () => {
  it('seeds the default table theme via migration', async () => {
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
      entities: [TableThemeEntity],
      migrations: [ConfigTables1756798403193],
    }) as DataSource;

    await dataSource.initialize();

    try {
      await dataSource.runMigrations();

      const repository = dataSource.getRepository(TableThemeEntity);
      const seeded = await repository.find();

      expect(seeded).toHaveLength(1);
      expect(seeded[0]).toMatchObject({
        hairline: TABLE_THEME_SEED.hairline,
        positions: TABLE_THEME_SEED.positions,
      });

      const service = new TableThemeService(repository);
      await expect(service.get()).resolves.toEqual({
        hairline: TABLE_THEME_SEED.hairline,
        positions: TABLE_THEME_SEED.positions,
      });
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  });
});
