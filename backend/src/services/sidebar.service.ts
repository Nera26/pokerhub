import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SidebarItem } from '../schemas/admin';
import { AdminTabEntity } from '../database/entities/admin-tab.entity';
import { normalizeSidebarIcon } from './sidebar-icon.util';

@Injectable()
export class SidebarService {
  constructor(
    @InjectRepository(AdminTabEntity)
    private readonly repo: Repository<AdminTabEntity>,
  ) {}

  async getItems(): Promise<SidebarItem[]> {
    const tabs = await this.repo.find({ order: { id: 'ASC' } });
    return tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      component: tab.component,
      icon: normalizeSidebarIcon(tab.icon),
    }));
  }
}
