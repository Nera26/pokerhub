import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SidebarItem } from '../schemas/admin';
import { AdminTabEntity } from '../database/entities/admin-tab.entity';

@Injectable()
export class SidebarService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AdminTabEntity)
    private readonly repo: Repository<AdminTabEntity>,
  ) {}

  async getItems(): Promise<SidebarItem[]> {
    let items = this.config.get<SidebarItem[]>('admin.sidebar', []) ?? [];
    if (!items.some((t) => t.id === 'events')) {
      items = [
        ...items,
        {
          id: 'events',
          label: 'Events',
          icon: 'faBell',
          component: '@/app/components/dashboard/AdminEvents',
        },
      ];
    }
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
      icon: this.formatIcon(it.icon),
    }));
  }

  private formatIcon(name: string): string {
    if (name.startsWith('fa')) return name;
    const pascal = name
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
    return `fa${pascal}`;
  }
}
