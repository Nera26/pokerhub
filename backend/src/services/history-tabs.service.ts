import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { HistoryTabItem } from '@shared/types';
import { HistoryTabEntity } from '../database/entities/history-tab.entity';
import { SimpleListService } from './simple-list.service';

@Injectable()
export class HistoryTabsService extends SimpleListService<HistoryTabEntity> {
  constructor(
    @InjectRepository(HistoryTabEntity) repo: Repository<HistoryTabEntity>,
  ) {
    super(repo);
  }

  async list(): Promise<HistoryTabItem[]> {
    const tabs = await this.find({ order: 'ASC' });
    return tabs.map(({ key, label }) => ({ key, label }));
  }
}
