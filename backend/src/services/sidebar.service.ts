import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SidebarItem } from '../schemas/admin';
import { AdminTabEntity } from '../database/entities/admin-tab.entity';
import { normalizeSidebarIcon } from './sidebar-icon.util';

@Injectable()
export class SidebarService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AdminTabEntity)
    private readonly repo: Repository<AdminTabEntity>,
  ) {}

  async getItems(): Promise<SidebarItem[]> {
    const items = this.config.get<SidebarItem[]>('admin.sidebar', []) ?? [];
    const requiredEntities = await this.repo.find();
    const required: SidebarItem[] = requiredEntities.map((e) => ({
      id: e.id,
      label: e.label,
      icon: e.icon,
      component: e.component,
    }));
    const merged = [
      ...items,
      ...required.filter((d) => !items.some((t) => t.id === d.id)),
    ];
    return merged.map((it) => ({
      ...it,
      icon: normalizeSidebarIcon(it.icon),
    }));
  }
}
