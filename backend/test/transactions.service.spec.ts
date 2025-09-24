import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { newDb } from 'pg-mem';
import { TransactionsService } from '../src/wallet/transactions.service';
import { TransactionType } from '../src/wallet/transaction-type.entity';
import { Transaction } from '../src/wallet/transaction.entity';
import { TransactionStatus } from '../src/wallet/transaction-status.entity';
import { TransactionTabEntity } from '../src/wallet/transaction-tab.entity';
import { TransactionColumnEntity } from '../src/wallet/transaction-column.entity';
import { TransactionColumnRepository } from '../src/wallet/transaction-column.repository';
import { TranslationsService } from '../src/services/translations.service';

const translationsMock = {
  get: jest.fn<Promise<Record<string, string>>, [string]>(),
};

describe('TransactionsService', () => {
  const DEFAULT_COLUMNS = [
    { id: 'date', label: 'Date' },
    { id: 'type', label: 'Type' },
    { id: 'amount', label: 'Amount' },
    { id: 'status', label: 'Status' },
  ] as const;
  let service: TransactionsService;
  let typeRepo: Repository<TransactionType>;
  let txnRepo: Repository<Transaction>;
  let statusRepo: Repository<TransactionStatus>;
  let tabRepo: Repository<TransactionTabEntity>;
  let columnRepo: TransactionColumnRepository;

  beforeEach(async () => {
    translationsMock.get.mockResolvedValue({
      'transactions.filters.allTypes': 'All Types',
      'transactions.filters.performedByAll': 'Performed By: All',
    });
    let dataSource: DataSource;
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            const db = newDb();
            db.public.registerFunction({
              name: 'now',
              returns: 'timestamp',
              implementation: () => new Date(),
            });
            db.public.registerFunction({
              name: 'version',
              returns: 'text',
              implementation: () => 'pg-mem',
            });
            db.public.registerFunction({
              name: 'current_database',
              returns: 'text',
              implementation: () => 'test',
            });
            db.public.registerFunction({
              name: 'uuid_generate_v4',
              returns: 'uuid',
              impure: true,
              implementation: () => crypto.randomUUID(),
            });
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [
                TransactionType,
                Transaction,
                TransactionStatus,
                TransactionTabEntity,
                TransactionColumnEntity,
              ],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([
          TransactionType,
          Transaction,
          TransactionStatus,
          TransactionTabEntity,
          TransactionColumnEntity,
        ]),
      ],
      providers: [
        TransactionsService,
        TransactionColumnRepository,
        { provide: TranslationsService, useValue: translationsMock },
      ],
    }).compile();

    service = moduleRef.get(TransactionsService);
    typeRepo = moduleRef.get(getRepositoryToken(TransactionType));
    txnRepo = moduleRef.get(getRepositoryToken(Transaction));
    statusRepo = moduleRef.get(getRepositoryToken(TransactionStatus));
    tabRepo = moduleRef.get(getRepositoryToken(TransactionTabEntity));
    columnRepo = moduleRef.get(TransactionColumnRepository);

    await typeRepo.save([
      { id: 'deposit', label: 'Deposit' },
      { id: 'withdrawal', label: 'Withdrawal' },
    ]);
    await statusRepo.save([
      {
        id: 'confirmed',
        label: 'Completed',
        style: 'bg-accent-green/20 text-accent-green',
      },
      {
        id: 'pending',
        label: 'Pending',
        style: 'bg-accent-yellow/20 text-accent-yellow',
      },
    ]);
    await tabRepo.save([
      { id: 'all', label: 'All' },
      { id: 'deposits', label: 'Deposits' },
    ]);
    await txnRepo.save({
      userId: 'user1',
      typeId: 'deposit',
      amount: 100,
      performedBy: 'Admin',
      notes: '',
      status: 'Completed',
    });
    await txnRepo.save({
      userId: 'user1',
      typeId: 'withdrawal',
      amount: -50,
      performedBy: 'User',
      notes: '',
      status: 'Pending',
    });
  });

  it('returns transaction types', async () => {
    const types = await service.getTransactionTypes();
    expect(types).toHaveLength(2);
  });

  it('returns transaction tabs', async () => {
    const tabs = await service.getTransactionTabs();
    expect(tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'all', label: 'All' }),
      ]),
    );
  });

  it('returns transaction statuses', async () => {
    const statuses = await service.getTransactionStatuses();
    expect(statuses.confirmed).toEqual({
      label: 'Completed',
      style: 'bg-accent-green/20 text-accent-green',
    });
  });

  it('returns filter options', async () => {
    const filters = await service.getFilterOptions();
    expect(filters.types).toContain('Deposit');
    expect(filters.performedBy).toEqual(expect.arrayContaining(['Admin', 'User']));
    expect(filters.typePlaceholder).toBe('All Types');
    expect(filters.performedByPlaceholder).toBe('Performed By: All');
  });

  it('omits placeholders when translations are unavailable', async () => {
    translationsMock.get.mockResolvedValueOnce({});

    const filters = await service.getFilterOptions();

    expect(filters.typePlaceholder).toBeUndefined();
    expect(filters.performedByPlaceholder).toBeUndefined();
  });

  it('returns user transactions', async () => {
    const entries = await service.getUserTransactions('user1');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveProperty('action');
  });

  describe('getTransactionColumns', () => {
    it('seeds default columns when no configuration exists', async () => {
      const columns = await service.getTransactionColumns();
      expect(columns).toEqual(DEFAULT_COLUMNS);

      const stored = await columnRepo.find();
      expect(stored).toHaveLength(DEFAULT_COLUMNS.length);
      for (const column of DEFAULT_COLUMNS) {
        expect(stored).toEqual(
          expect.arrayContaining([expect.objectContaining(column)]),
        );
      }
    });

    it('maps stored columns to the response schema', async () => {
      await columnRepo.save([
        { id: 'type', label: 'Type' },
        { id: 'amount', label: 'Amount' },
      ]);

      const columns = await service.getTransactionColumns();
      expect(columns).toEqual([
        { id: 'type', label: 'Type' },
        { id: 'amount', label: 'Amount' },
      ]);
    });

    it('propagates repository errors', async () => {
      jest
        .spyOn(columnRepo, 'find')
        .mockRejectedValueOnce(new Error('database unavailable'));

      await expect(service.getTransactionColumns()).rejects.toThrow(
        'database unavailable',
      );
    });
  });
});
