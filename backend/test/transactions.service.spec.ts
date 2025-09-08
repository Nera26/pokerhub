import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { newDb } from 'pg-mem';
import { TransactionsService } from '../src/wallet/transactions.service';
import { TransactionType } from '../src/wallet/transaction-type.entity';
import { Transaction } from '../src/wallet/transaction.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let typeRepo: Repository<TransactionType>;
  let txnRepo: Repository<Transaction>;

  beforeEach(async () => {
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
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [TransactionType, Transaction],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([TransactionType, Transaction]),
      ],
      providers: [TransactionsService],
    }).compile();

    service = moduleRef.get(TransactionsService);
    typeRepo = moduleRef.get(getRepositoryToken(TransactionType));
    txnRepo = moduleRef.get(getRepositoryToken(Transaction));

    await typeRepo.save([
      { id: 'deposit', label: 'Deposit' },
      { id: 'withdrawal', label: 'Withdrawal' },
    ]);
    await txnRepo.save([
      {
        userId: 'user1',
        typeId: 'deposit',
        amount: 100,
        performedBy: 'Admin',
        notes: '',
        status: 'Completed',
      },
      {
        userId: 'user1',
        typeId: 'withdrawal',
        amount: -50,
        performedBy: 'User',
        notes: '',
        status: 'Pending',
      },
    ]);
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

  it('returns filter options', async () => {
    const filters = await service.getFilterOptions();
    expect(filters.types).toContain('Deposit');
    expect(filters.performedBy).toEqual(expect.arrayContaining(['Admin', 'User']));
  });

  it('returns user transactions', async () => {
    const entries = await service.getUserTransactions('user1');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveProperty('action');
  });
});
