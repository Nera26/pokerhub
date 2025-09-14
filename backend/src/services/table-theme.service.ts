import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { paths } from '@contracts/api';
import { TableThemeEntity } from '../database/entities/table-theme.entity';

type TableThemeResponse =
  paths['/config/table-theme']['get']['responses']['200']['content']['application/json'];

const DEFAULT_THEME: TableThemeResponse = {
  hairline: 'var(--color-hairline)',
  positions: {},
};

@Injectable()
export class TableThemeService {
  constructor(
    @InjectRepository(TableThemeEntity)
    private readonly repo: Repository<TableThemeEntity>,
  ) {}

  async get(): Promise<TableThemeResponse> {
    const entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      throw new NotFoundException('Table theme not found');
    }
    return { hairline: entity.hairline, positions: entity.positions };
  }

  async update(theme: TableThemeResponse): Promise<TableThemeResponse> {
    let entity = await this.repo.findOne({ where: {} });

    if (!entity) {
      entity = this.repo.create({
        hairline: theme.hairline ?? DEFAULT_THEME.hairline,
        positions: theme.positions ?? DEFAULT_THEME.positions,
      });
    } else {
      entity.hairline = theme.hairline ?? DEFAULT_THEME.hairline;
      entity.positions = theme.positions ?? DEFAULT_THEME.positions;
    }

    await this.repo.save(entity);
    return { hairline: entity.hairline, positions: entity.positions };
  }
}
