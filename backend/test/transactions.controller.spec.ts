import { Test } from '@nestjs/testing';
import { ForbiddenException, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TransactionsController } from '../src/routes/transactions.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from '../src/wallet/transactions.service';
import { TransactionType } from '../src/wallet/transaction-type.entity';
import { Transaction } from '../src/wallet/transaction.entity';
import { TransactionStatus } from '../src/wallet/transaction-status.entity';
import { TransactionTabEntity } from '../src/wallet/transaction-tab.entity';
import { TransactionColumnEntity } from '../src/wallet/transaction-column.entity';
import { TransactionColumnRepository } from '../src/wallet/transaction-column.repository';
import { DataSource, Repository } from 'typeorm';
import { newDb } from 'pg-mem';

const DEFAULT_COLUMNS = [
  { id: 'date', label: 'Date' },
  { id: 'type', label: 'Type' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
] as const;

describe('TransactionsController', () => {
  let app: INestApplication;
  let typeRepo: Repository<TransactionType>;
  let txnRepo: Repository<Transaction>;
  let statusRepo: Repository<TransactionStatus>;
  let tabRepo: Repository<TransactionTabEntity>;
  let columnRepo: TransactionColumnRepository;
  const adminGuard = {
    canActivate: jest.fn((context: any) => {
      const req = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
      if (req.headers['x-admin'] === '1') {
        return true;
      }
      throw new ForbiddenException();
    }),
  };

  beforeAll(async () => {
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
      controllers: [TransactionsController],
      providers: [TransactionsService, TransactionColumnRepository],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue(adminGuard)
      .compile();

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
    ]);
    await tabRepo.save([{ id: 'all', label: 'All' }]);
    await columnRepo.save(
      DEFAULT_COLUMNS.map((column) => ({ ...column })),
    );
    await txnRepo.save({
      userId: 'user1',
      typeId: 'deposit',
      amount: 100,
      performedBy: 'Admin',
      notes: '',
      status: 'Completed',
      createdAt: new Date('2024-01-10'),
    });
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    adminGuard.canActivate.mockClear();
  });

  it('returns transaction types', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions/types')
      .set('Authorization', 'Bearer test')
      .set('x-admin', '1')
      .expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([{ id: 'deposit', label: 'Deposit' }]),
    );
  });

  it('returns transaction statuses', async () => {
    const callsBefore = adminGuard.canActivate.mock.calls.length;
    const res = await request(app.getHttpServer())
      .get('/transactions/statuses')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body.confirmed).toEqual({
      label: 'Completed',
      style: 'bg-accent-green/20 text-accent-green',
    });
    expect(adminGuard.canActivate.mock.calls.length).toBe(callsBefore);
  });

  it('returns transaction columns', async () => {
    const callsBefore = adminGuard.canActivate.mock.calls.length;
    const res = await request(app.getHttpServer())
      .get('/transactions/columns')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body).toEqual(expect.arrayContaining(DEFAULT_COLUMNS));
    expect(adminGuard.canActivate.mock.calls.length).toBe(callsBefore);
  });

  it('seeds default columns when configuration is missing', async () => {
    await columnRepo.clear();

    const res = await request(app.getHttpServer())
      .get('/transactions/columns')
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(res.body).toEqual(DEFAULT_COLUMNS);
    const stored = await columnRepo.find();
    expect(stored).toHaveLength(DEFAULT_COLUMNS.length);
    for (const column of DEFAULT_COLUMNS) {
      expect(stored).toEqual(
        expect.arrayContaining([expect.objectContaining(column)]),
      );
    }
  });

  it('returns user transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/user1/transactions')
      .set('Authorization', 'Bearer test')
      .set('x-admin', '1')
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('action', 'Deposit');
  });

  it('filters transactions by date range', async () => {
    await txnRepo.save({
      id: crypto.randomUUID(),
      userId: 'user2',
      typeId: 'withdrawal',
      amount: 50,
      performedBy: 'Admin',
      notes: '',
      status: 'Completed',
      createdAt: new Date('2024-03-05'),
    });
    const res = await request(app.getHttpServer())
      .get(
        '/admin/transactions?startDate=2024-03-01&endDate=2024-03-31&page=1&pageSize=10',
      )
      .set('Authorization', 'Bearer test')
      .set('x-admin', '1')
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('amount', 50);
  });

  it('rejects non-admin access to admin endpoints', async () => {
    await request(app.getHttpServer())
      .get('/transactions/types')
      .set('Authorization', 'Bearer test')
      .expect(403);
  });
});
