import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from './transaction-type.entity';
import { Transaction } from './transaction.entity';
import {
  FilterOptionsSchema,
  TransactionEntriesSchema,
  TransactionLogResponseSchema,
  TransactionLogQuerySchema,
} from '@shared/types';
import type {
  FilterOptions,
  TransactionEntries,
  TransactionLogQuery,
} from '@shared/types';
import type { TransactionTab } from '@shared/wallet.schema';
import { TransactionTypesResponseSchema } from '../schemas/transactions';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionType)
    private readonly types: Repository<TransactionType>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async getFilterOptions(): Promise<FilterOptions> {
    const types = await this.types.find();
    const performedByRaw = await this.txRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.performedBy', 'performedBy')
      .getRawMany();
    return FilterOptionsSchema.parse({
      types: types.map((t) => t.label),
      performedBy: performedByRaw.map((r) => r.performedBy),
    });
  }

  async getTransactionTypes() {
    const res = await this.types.find();
    return TransactionTypesResponseSchema.parse(res);
  }

  async getTransactionTabs(): Promise<TransactionTab[]> {
    return [
      { id: 'all', label: 'All' },
      { id: 'deposits', label: 'Deposits' },
      { id: 'withdrawals', label: 'Withdrawals' },
      { id: 'manual', label: 'Manual Adjustments' },
    ];
  }

  async getUserTransactions(userId: string): Promise<TransactionEntries> {
    const txs = await this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return TransactionEntriesSchema.parse(
      txs.map((t) => ({
        date: t.createdAt.toISOString(),
        action: t.type.label,
        amount: t.amount,
        performedBy: t.performedBy,
        notes: t.notes,
        status: t.status as 'Completed' | 'Pending' | 'Rejected',
      })),
    );
  }

  async getTransactionsLog(query: TransactionLogQuery) {
    const { playerId, type, startDate, endDate, page, pageSize } =
      TransactionLogQuerySchema.parse(query);
    const qb = this.txRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.type', 'type')
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (playerId) qb.andWhere('t.userId = :playerId', { playerId });
    if (type) qb.andWhere('t.typeId = :type', { type });
    if (startDate)
      qb.andWhere('t.createdAt >= :startDate', { startDate: new Date(startDate) });
    if (endDate)
      qb.andWhere('t.createdAt <= :endDate', { endDate: new Date(endDate) });
    const txs = await qb.getMany();
    return TransactionLogResponseSchema.parse(
      txs.map((t) => ({
        datetime: t.createdAt.toISOString(),
        action: t.type.label,
        amount: t.amount,
        by: t.performedBy,
        notes: t.notes,
        status: t.status,
      })),
    );
  }
}
