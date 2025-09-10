import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TABLE_THEME } from '@shared/config/tableTheme';
import type { TableThemeResponse } from '@shared/types';
import { TableThemeEntity } from '../database/entities/table-theme.entity';

export const DEFAULT_TABLE_THEME: TableThemeResponse = {
  hairline: TABLE_THEME.hairline,
  positions: {
    BTN: {
      color: 'hsl(44,88%,60%)',
      glow: 'hsla(44,88%,60%,0.45)',
      badge: '/badges/btn.svg',
    },
    SB: {
      color: 'hsl(202,90%,60%)',
      glow: 'hsla(202,90%,60%,0.45)',
      badge: '/badges/sb.svg',
    },
    BB: {
      color: 'hsl(275,85%,65%)',
      glow: 'hsla(275,85%,65%,0.45)',
      badge: '/badges/bb.svg',
    },
    UTG: {
      color: 'var(--color-pos-utg)',
      glow: 'var(--glow-pos-utg)',
    },
    MP: {
      color: 'var(--color-pos-mp)',
      glow: 'var(--glow-pos-mp)',
    },
    CO: {
      color: 'var(--color-pos-co)',
      glow: 'var(--glow-pos-co)',
    },
    HJ: {
      color: 'var(--color-pos-hj)',
      glow: 'var(--glow-pos-hj)',
    },
    LJ: {
      color: 'var(--color-pos-lj)',
      glow: 'var(--glow-pos-lj)',
    },
  },
};

@Injectable()
export class TableThemeService {
  constructor(
    @InjectRepository(TableThemeEntity)
    private readonly repo: Repository<TableThemeEntity>,
  ) {}

  async get(): Promise<TableThemeResponse> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create(DEFAULT_TABLE_THEME);
      await this.repo.save(entity);
    }
    return { hairline: entity.hairline, positions: entity.positions };
  }

  async update(theme: TableThemeResponse): Promise<TableThemeResponse> {
    let entity = await this.repo.findOne({ where: {} });

    if (!entity) {
      entity = this.repo.create({
        hairline: theme.hairline ?? DEFAULT_TABLE_THEME.hairline,
        positions: theme.positions ?? DEFAULT_TABLE_THEME.positions,
      });
    } else {
      entity.hairline = theme.hairline;
      entity.positions = theme.positions;
    }

    await this.repo.save(entity);
    return { hairline: entity.hairline, positions: entity.positions };
  }
}
