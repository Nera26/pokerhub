process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { BonusService } from '../src/services/bonus.service';
import { AdminBonusesController } from '../src/routes/admin-bonuses.controller';
import { BonusOptionEntity } from '../src/database/entities/bonus-option.entity';
import { BonusEntity } from '../src/database/entities/bonus.entity';
import { BonusDefaultEntity } from '../src/database/entities/bonus-default.entity';
import { Transaction } from '../src/wallet/transaction.entity';

const createMockRepository = () => ({
  findOne: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn((input) => input),
  save: jest.fn(async (entity) => entity),
  clear: jest.fn().mockResolvedValue(undefined),
  find: jest.fn().mockResolvedValue([]),
});

function createTestModule() {
  let dataSource: DataSource;
  const defaultsRepo = createMockRepository();
  const transactionsRepo = createMockRepository();
  const configService = { get: jest.fn() } as Partial<ConfigService>;
  @Module({
    imports: [
      TypeOrmModule.forRootAsync({
        useFactory: () => {
          const db = newDb();
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
            entities: [BonusOptionEntity, BonusEntity],
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([BonusOptionEntity, BonusEntity]),
    ],
    controllers: [AdminBonusesController],
    providers: [
      BonusService,
      {
        provide: getRepositoryToken(BonusDefaultEntity),
        useValue: defaultsRepo,
      },
      {
        provide: getRepositoryToken(Transaction),
        useValue: transactionsRepo,
      },
      {
        provide: ConfigService,
        useValue: configService,
      },
    ],
  })
  class BonusCrudTestModule {}
  return { BonusCrudTestModule, getDataSource: () => dataSource };
}

const createPayload = () => ({
  name: 'Spring Splash',
  type: 'deposit',
  description: 'Welcome offer',
  bonusPercent: 50,
  maxBonusUsd: 500,
  expiryDate: '2025-12-31',
  eligibility: 'all',
  status: 'active',
});

describe('AdminBonusesController', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeEach(async () => {
    const { BonusCrudTestModule, getDataSource } = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [BonusCrudTestModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    dataSource = getDataSource();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('lists existing bonuses', async () => {
    const repo = dataSource.getRepository(BonusEntity);
    await repo.save([
      {
        name: 'VIP Cashback',
        type: 'rebate',
        description: 'Weekly cashback',
        bonusPercent: 10,
        maxBonusUsd: 100,
        expiryDate: '2025-01-31',
        eligibility: 'vip',
        status: 'active',
        claimsTotal: 5,
        claimsWeek: 2,
      },
      {
        name: 'New Player Boost',
        type: 'first-deposit',
        description: '100% match',
        bonusPercent: 100,
        maxBonusUsd: 200,
        expiryDate: null,
        eligibility: 'new',
        status: 'paused',
        claimsTotal: 10,
        claimsWeek: 0,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/admin/bonuses')
      .expect(200);

    expect(response.body).toEqual([
      {
        id: expect.any(Number),
        name: 'New Player Boost',
        type: 'first-deposit',
        description: '100% match',
        bonusPercent: 100,
        maxBonusUsd: 200,
        expiryDate: undefined,
        eligibility: 'new',
        status: 'paused',
        claimsTotal: 10,
        claimsWeek: 0,
      },
      {
        id: expect.any(Number),
        name: 'VIP Cashback',
        type: 'rebate',
        description: 'Weekly cashback',
        bonusPercent: 10,
        maxBonusUsd: 100,
        expiryDate: '2025-01-31',
        eligibility: 'vip',
        status: 'active',
        claimsTotal: 5,
        claimsWeek: 2,
      },
    ]);
  });

  it('creates a bonus', async () => {
    const payload = createPayload();

    const response = await request(app.getHttpServer())
      .post('/admin/bonuses')
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      ...payload,
      claimsTotal: 0,
      claimsWeek: 0,
    });

    const repo = dataSource.getRepository(BonusEntity);
    const stored = await repo.find();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      name: payload.name,
      expiryDate: payload.expiryDate,
      claimsTotal: 0,
      claimsWeek: 0,
    });
  });

  it('updates an existing bonus', async () => {
    const repo = dataSource.getRepository(BonusEntity);
    const created = await repo.save({
      ...createPayload(),
      expiryDate: null,
    });

    const response = await request(app.getHttpServer())
      .put(`/admin/bonuses/${created.id}`)
      .send({ status: 'paused', expiryDate: '2026-01-01' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: created.id,
      status: 'paused',
      expiryDate: '2026-01-01',
    });

    const updated = await repo.findOneBy({ id: created.id });
    expect(updated?.status).toBe('paused');
    expect(updated?.expiryDate).toBe('2026-01-01');
  });

  it('returns 404 when updating missing bonus', async () => {
    await request(app.getHttpServer())
      .put('/admin/bonuses/999')
      .send({ status: 'paused' })
      .expect(404);
  });

  it('deletes a bonus', async () => {
    const repo = dataSource.getRepository(BonusEntity);
    const created = await repo.save(createPayload());

    const response = await request(app.getHttpServer())
      .delete(`/admin/bonuses/${created.id}`)
      .expect(200);

    expect(response.body).toEqual({ message: 'deleted' });
    const remaining = await repo.find();
    expect(remaining).toHaveLength(0);
  });
});
