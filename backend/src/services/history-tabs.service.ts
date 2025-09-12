import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { HistoryTabItem } from '@shared/types';
import { HistoryTabEntity } from '../database/entities/history-tab.entity';

@Injectable()
export class HistoryTabsService {
  constructor(
    @InjectRepository(HistoryTabEntity)
    private readonly repo: Repository<HistoryTabEntity>,
  ) {}

  async list(): Promise<HistoryTabItem[]> {
    const tabs = await this.repo.find({ order: { order: 'ASC' } });
    return tabs.map(({ key, label }) => ({ key, label }));
  }
}
