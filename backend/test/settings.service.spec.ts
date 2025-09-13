import { ChartPaletteEntity } from '../src/database/entities/chart-palette.entity';
import type { Repository } from 'typeorm';

describe('SettingsService', () => {
  let repo: Partial<Repository<ChartPaletteEntity>>;
  let entities: ChartPaletteEntity[];

  const loadService = () => {
    jest.resetModules();
    const { SettingsService } = require('../src/services/settings.service');
    return new SettingsService(repo as Repository<ChartPaletteEntity>);
  };

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
  });

  it('returns empty array when table empty and env var unset', async () => {
    delete process.env.DEFAULT_CHART_PALETTE;
    const service = loadService();
    await expect(service.getChartPalette()).resolves.toEqual([]);
  });

  it('returns palette from env var when table empty', async () => {
    process.env.DEFAULT_CHART_PALETTE = '#111,#222';
    const service = loadService();
    await expect(service.getChartPalette()).resolves.toEqual(['#111', '#222']);
  });

  it('persists and retrieves palette', async () => {
    delete process.env.DEFAULT_CHART_PALETTE;
    const service = loadService();
    await service.setChartPalette(['#111', '#222']);
    expect(await service.getChartPalette()).toEqual(['#111', '#222']);
  });
});
