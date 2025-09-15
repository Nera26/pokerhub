import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readFile } from 'fs/promises';
import path from 'path';
import type { NavIcon } from '@shared/types';
import { NavIconEntity } from '../database/entities/nav-icon.entity';
import { SimpleListService } from './simple-list.service';

@Injectable()
export class NavIconsService extends SimpleListService<NavIconEntity> {
  constructor(
    @InjectRepository(NavIconEntity) repo: Repository<NavIconEntity>,
  ) {
    super(repo);
  }

  async list(): Promise<NavIcon[]> {
    return this.find();
  }

  async create(icon: NavIcon): Promise<NavIcon> {
    const entity = this.repo.create(icon);
    return this.repo.save(entity);
  }

  async update(name: string, icon: NavIcon): Promise<NavIcon> {
    const existing = await this.repo.findOne({ where: { name } });
    if (!existing) throw new NotFoundException('Nav icon not found');
    const merged = { ...existing, ...icon };
    return this.repo.save(merged);
  }

  async remove(name: string): Promise<void> {
    await this.repo.delete({ name });
  }

  async seed(file = path.join(__dirname, '../seeds/nav-icons.json')): Promise<NavIcon[]> {
    const data = await readFile(file, 'utf8');
    const icons: NavIcon[] = JSON.parse(data);
    await this.repo.upsert(icons, ['name']);
    return this.list();
  }
}
