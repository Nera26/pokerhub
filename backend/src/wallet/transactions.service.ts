import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from './transaction-type.entity';
import { Transaction } from './transaction.entity';
import { FilterOptionsSchema, TransactionEntriesSchema } from '@shared/types';
import type { FilterOptions, TransactionEntries } from '@shared/types';
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
}
