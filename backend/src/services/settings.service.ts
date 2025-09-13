import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartPaletteEntity } from '../database/entities/chart-palette.entity';

const DEFAULT_PALETTE = ['#ff4d4f', '#facc15', '#3b82f6', '#22c55e'];

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ChartPaletteEntity)
    private readonly repo: Repository<ChartPaletteEntity>,
  ) {}

  async getChartPalette(): Promise<string[]> {
    const entities = await this.repo.find({ order: { id: 'ASC' } });
    if (entities.length === 0) {
      return DEFAULT_PALETTE;
    }
    return entities.map((e) => e.color);
  }

  async setChartPalette(colors: string[]): Promise<string[]> {
    await this.repo.clear();
    if (colors.length === 0) {
      return [];
    }
    const entities = colors.map((color) => this.repo.create({ color }));
    await this.repo.save(entities);
    return entities.map((e) => e.color);
  }
}
