import { TableThemeService } from '../src/services/table-theme.service';
import { TableThemeEntity } from '../src/database/entities/table-theme.entity';
import type { Repository } from 'typeorm';
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
