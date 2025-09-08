import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { SidebarItem } from '../schemas/sidebar';

@Injectable()
export class SidebarService {
  constructor(private readonly db: DataSource) {}

  async list(): Promise<SidebarItem[]> {
    const rows = await this.db.query(
      'SELECT id, label, icon, path, disabled FROM admin_sidebar ORDER BY position ASC',
    );
    return rows.map((r: any) => ({
      id: r.id,
      label: r.label,
      icon: r.icon,
      path: r.path ?? undefined,
      disabled: r.disabled ?? undefined,
    }));
  }
}
