import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TableThemeResponse } from '@shared/types';
import { TableThemeEntity } from '../database/entities/table-theme.entity';

@Injectable()
export class TableThemeService {
  constructor(
    @InjectRepository(TableThemeEntity)
    private readonly repo: Repository<TableThemeEntity>,
  ) {}

  async get(): Promise<TableThemeResponse> {
    const entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      return { hairline: '', positions: {} };
    }
    return { hairline: entity.hairline, positions: entity.positions };
  }

  async update(theme: TableThemeResponse): Promise<TableThemeResponse> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create(theme);
    } else {
      entity.hairline = theme.hairline;
      entity.positions = theme.positions;
    }
    await this.repo.save(entity);
    return { hairline: entity.hairline, positions: entity.positions };
  }
}
