import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { z } from 'zod';
import { TransactionType } from './transaction-type.entity';
import { Transaction } from './transaction.entity';
import { TransactionStatus } from './transaction-status.entity';
import { TransactionTabEntity } from './transaction-tab.entity';
import { TransactionColumnRepository } from './transaction-column.repository';
import { TranslationsService } from '../services/translations.service';
import {
  FilterOptionsSchema,
  AdminTransactionEntriesSchema,
  TransactionLogResponseSchema,
  TransactionLogQuerySchema,
  TransactionTypesResponseSchema,
  TransactionStatusesResponseSchema,
  TransactionColumnsResponseSchema,
  type TransactionLogQuery,
  type FilterOptions,
} from '@shared/transactions.schema';
import type { TransactionTab } from '@shared/wallet.schema';

const DEFAULT_TRANSACTION_COLUMNS = [
  { id: 'date', label: 'Date' },
  { id: 'type', label: 'Type' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
] as const;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionType)
    private readonly types: Repository<TransactionType>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(TransactionStatus)
    private readonly statusRepo: Repository<TransactionStatus>,
    @InjectRepository(TransactionTabEntity)
    private readonly tabRepo: Repository<TransactionTabEntity>,
    private readonly columnRepo: TransactionColumnRepository,
    private readonly translations: TranslationsService,
  ) {}

  async getFilterOptions(locale = 'en'): Promise<FilterOptions> {
    const types = await this.types.find();
    const performedByRaw = await this.txRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.performedBy', 'performedBy')
      .getRawMany();
    const messages = await this.translations.get(locale);
    const typePlaceholder =
      messages['transactions.filters.allTypes'] ?? 'All Types';
    const performedByPlaceholder =
      messages['transactions.filters.performedByAll'] ?? 'Performed By: All';
    return FilterOptionsSchema.parse({
      types: types.map((t) => t.label),
      performedBy: performedByRaw.map((r) => r.performedBy),
      typePlaceholder,
      performedByPlaceholder,
    });
  }

  async getTransactionTypes() {
    const res = await this.types.find();
    return TransactionTypesResponseSchema.parse(res);
  }

  async getTransactionStatuses() {
    const rows = await this.statusRepo.find();
    const map = Object.fromEntries(
      rows.map((s) => [s.id, { label: s.label, style: s.style }]),
    );
    return TransactionStatusesResponseSchema.parse(map);
  }

  async getTransactionTabs(): Promise<TransactionTab[]> {
    const tabs = await this.tabRepo.find();
    return tabs.map((t) => ({ id: t.id, label: t.label }));
  }

  async getTransactionColumns() {
    const columns = await this.columnRepo.find();
    const normalized =
      columns.length > 0 ? columns : await this.ensureDefaultColumns();

    return TransactionColumnsResponseSchema.parse(
      normalized.map((column) => ({
        id: column.id,
        label: column.label,
      })),
    );
  }

  private async ensureDefaultColumns() {
    const created = DEFAULT_TRANSACTION_COLUMNS.map((column) =>
      this.columnRepo.create(column),
    );
    await this.columnRepo.save(created);
    return created;
  }

  async getUserTransactions(
    userId: string,
  ): Promise<z.infer<typeof AdminTransactionEntriesSchema>> {
    const txs = await this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return AdminTransactionEntriesSchema.parse(
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
