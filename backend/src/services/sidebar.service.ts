import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SidebarItem } from '../schemas/admin';

@Injectable()
export class SidebarService {
  constructor(private readonly config: ConfigService) {}

  async getItems(): Promise<SidebarItem[]> {
    const items = this.config.get<SidebarItem[]>('admin.sidebar', []) ?? [];
    return items.map((it) => ({
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
