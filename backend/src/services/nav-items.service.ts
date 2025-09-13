import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NavItem } from '@shared/types';
import { NavItemEntity } from '../database/entities/nav-item.entity';
import { SimpleListService } from './simple-list.service';

@Injectable()
export class NavItemsService extends SimpleListService<NavItemEntity> {
  constructor(
    @InjectRepository(NavItemEntity) repo: Repository<NavItemEntity>,
  ) {
    super(repo);
  }

  async list(): Promise<NavItem[]> {
    const items = await this.find({ order: 'ASC' });
    return items.map(({ flag, href, label, icon }) => ({
      flag,
      href,
      label,
      ...(icon ? { icon } : {}),
    }));
  }
}
