import { Injectable } from '@nestjs/common';
import type { HistoryTabItem } from '@shared/types';

@Injectable()
export class HistoryTabsService {
  async list(): Promise<HistoryTabItem[]> {
    return [
      { key: 'game-history', label: 'Game History' },
      { key: 'tournament-history', label: 'Tournament History' },
      { key: 'transaction-history', label: 'Deposit/Withdraw' },
    ];
  }
}
