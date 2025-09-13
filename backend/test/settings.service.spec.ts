import { SettingsService } from '../src/services/settings.service';
import { ChartPaletteEntity } from '../src/database/entities/chart-palette.entity';
import type { Repository } from 'typeorm';

describe('SettingsService', () => {
  let repo: Partial<Repository<ChartPaletteEntity>>;
  let entities: ChartPaletteEntity[];
  let service: SettingsService;
  const defaultPalette = ['#ff4d4f', '#facc15', '#3b82f6', '#22c55e'];

  beforeEach(() => {
    entities = [];
    repo = {
      find: jest.fn(async () => entities),
      clear: jest.fn(async () => {
        entities = [];
      }),
      create: jest.fn((data) => data as ChartPaletteEntity),
      save: jest.fn(async (data: ChartPaletteEntity[]) => {
        entities = data.map((c, i) => ({ id: i + 1, ...c }));
        return entities;
      }),
    };
    service = new SettingsService(repo as Repository<ChartPaletteEntity>);
  });

  it('returns default palette when table empty', async () => {
    await expect(service.getChartPalette()).resolves.toEqual(defaultPalette);
  });

  it('persists and retrieves palette', async () => {
    await service.setChartPalette(['#111', '#222']);
    expect(await service.getChartPalette()).toEqual(['#111', '#222']);
  });
});
