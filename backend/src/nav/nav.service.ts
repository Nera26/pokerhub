import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NavItem, NavItemRequest } from '@shared/types';
import { NavItemEntity } from '../database/entities/nav-item.entity';

@Injectable()
export class NavService {
  constructor(
    @InjectRepository(NavItemEntity)
    private readonly repo: Repository<NavItemEntity>,
  ) {}

  async list(): Promise<NavItem[]> {
    const items = await this.repo.find({ order: { order: 'ASC' } });
    return items.map(({ flag, href, label, icon, order }) => ({
      flag,
      href,
      label,
      order,
      ...(icon ? { icon } : {}),
    }));
  }

  async create(item: NavItemRequest): Promise<NavItem> {
    const entity = this.repo.create(item);
    const saved = await this.repo.save(entity);
    const { flag, href, label, icon, order } = saved;
    return { flag, href, label, order, ...(icon ? { icon } : {}) };
  }

  async update(flag: string, item: NavItemRequest): Promise<NavItem> {
    const existing = await this.repo.findOne({ where: { flag } });
    if (!existing) throw new NotFoundException('Nav item not found');
    const merged = { ...existing, ...item };
    const saved = await this.repo.save(merged);
    const { href, label, icon, order: savedOrder } = saved;
    return {
      flag: saved.flag,
      href,
      label,
      order: savedOrder,
      ...(icon ? { icon } : {}),
    };
  }

  async remove(flag: string): Promise<void> {
    await this.repo.delete({ flag });
  }
}

