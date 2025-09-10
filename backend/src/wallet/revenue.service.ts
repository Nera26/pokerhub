import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import type { RevenueBreakdown } from '@shared/types';

export type TimeRange = 'today' | 'week' | 'month' | 'all';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async getBreakdown(range: TimeRange): Promise<RevenueBreakdown> {
    const txs = await this.txRepo.find({ relations: ['type'] });
    const start = this.getStartDate(range);
    const filtered = start
      ? txs.filter((t) => t.createdAt >= start)
      : txs;
    const totals: Record<string, number> = {};
    let total = 0;
    for (const tx of filtered) {
      const label = tx.type.label;
      totals[label] = (totals[label] ?? 0) + tx.amount;
      total += tx.amount;
    }
    return Object.entries(totals).map(([label, value]) => ({
      label,
      pct: total === 0 ? 0 : (value / total) * 100,
      value,
    }));
  }

  private getStartDate(range: TimeRange): Date | null {
    const now = new Date();
    switch (range) {
      case 'today': {
        const start = new Date(now);
        start.setUTCHours(0, 0, 0, 0);
        return start;
      }
      case 'week': {
        const start = new Date(now);
        start.setUTCDate(start.getUTCDate() - 7);
        return start;
      }
      case 'month': {
        const start = new Date(now);
        start.setUTCMonth(start.getUTCMonth() - 1);
        return start;
      }
      default:
        return null;
    }
  }
}
