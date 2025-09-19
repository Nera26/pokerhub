import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type AdminTabConfig,
  type CreateAdminTabRequest,
  type UpdateAdminTabRequest,
} from '../schemas/admin';
import { AdminTabEntity } from '../database/entities/admin-tab.entity';
import { normalizeSidebarIcon } from './sidebar-icon.util';

@Injectable()
export class AdminTabsService {
  constructor(
    @InjectRepository(AdminTabEntity)
    private readonly repo: Repository<AdminTabEntity>,
  ) {}

  async list(): Promise<AdminTabConfig[]> {
    const tabs = await this.repo.find({ order: { id: 'ASC' } });
    return tabs.map((tab) => this.toConfig(tab));
  }

  async create(payload: CreateAdminTabRequest): Promise<AdminTabConfig> {
    const entity = this.repo.create({
      id: payload.id,
      label: payload.title,
      icon: normalizeSidebarIcon(payload.icon),
      component: payload.component,
    });
    const saved = await this.repo.save(entity);
    return this.toConfig(saved);
  }

  async update(
    id: string,
    payload: UpdateAdminTabRequest,
  ): Promise<AdminTabConfig> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Admin tab not found');
    }
    existing.label = payload.title;
    existing.icon = normalizeSidebarIcon(payload.icon);
    existing.component = payload.component;
    const saved = await this.repo.save(existing);
    return this.toConfig(saved);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async find(id: string): Promise<AdminTabConfig | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toConfig(entity) : null;
  }

  private toConfig(entity: AdminTabEntity): AdminTabConfig {
    return {
      id: entity.id,
      title: entity.label,
      icon: normalizeSidebarIcon(entity.icon),
      component: entity.component,
    };
  }
}

