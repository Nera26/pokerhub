import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SidebarItem } from '../schemas/admin';

@Injectable()
export class AdminSidebarRepository {
  constructor(private readonly config: ConfigService) {}

  async findAll(): Promise<SidebarItem[]> {
    return this.config.get<SidebarItem[]>('admin.sidebar', []) ?? [];
  }
}
