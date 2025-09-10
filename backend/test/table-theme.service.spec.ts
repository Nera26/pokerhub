import { TableThemeService, DEFAULT_TABLE_THEME } from '../src/services/table-theme.service';
import { TableThemeEntity } from '../src/database/entities/table-theme.entity';
import type { Repository } from 'typeorm';

describe('TableThemeService', () => {
  let entity: TableThemeEntity | null;
  let repo: Partial<Repository<TableThemeEntity>>;
  let service: TableThemeService;

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

  it('seeds defaults when no theme exists', async () => {
    const theme = await service.get();
    expect(theme).toEqual(DEFAULT_TABLE_THEME);
    expect((repo.save as jest.Mock).mock.calls.length).toBe(1);
  });

  it('updates theme', async () => {
    await service.get();
    const updated = { ...DEFAULT_TABLE_THEME, hairline: 'var(--color-alt)' };
    const res = await service.update(updated);
    expect(res).toEqual(updated);
    expect(entity?.hairline).toBe('var(--color-alt)');
  });
});
