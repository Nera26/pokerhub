import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SidebarItem } from '../schemas/admin';

@Injectable()
export class SidebarService {
  constructor(private readonly config: ConfigService) {}

  async getItems(): Promise<SidebarItem[]> {
    const items = this.config.get<SidebarItem[]>('admin.sidebar', []) ?? [];
    const required: SidebarItem[] = [
      {
        id: 'users',
        label: 'Users',
        icon: 'faUsers',
        component: '@/app/components/dashboard/ManageUsers',
      },
      {
        id: 'tables',
        label: 'Tables',
        icon: 'faTable',
        component: '@/app/components/dashboard/ManageTables',
      },
      {
        id: 'tournaments',
        label: 'Tournaments',
        icon: 'faTrophy',
        component: '@/app/components/dashboard/ManageTournaments',
      },
    ];
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
