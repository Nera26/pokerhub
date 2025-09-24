process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { AdminBonusController } from '../src/routes/admin-bonus.controller';
import { BonusService } from '../src/services/bonus.service';
import { BonusOptionEntity } from '../src/database/entities/bonus-option.entity';
import { BonusEntity } from '../src/database/entities/bonus.entity';
import { BonusDefaultEntity } from '../src/database/entities/bonus-default.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { bonusEntities, expectedOptions, expectedDefaults } from './bonus/fixtures';
import { Transaction } from '../src/wallet/transaction.entity';
import { TransactionType } from '../src/wallet/transaction-type.entity';

const configMock = {
  get: (key: string) => {
    if (key === 'DEFAULT_CURRENCY') return 'usd';
    if (key === 'WALLET_MINOR_PER_MAJOR') return 100;
    return undefined;
  },
};


function createTestModule() {
  let dataSource: DataSource;
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
          db.public.registerFunction({
            name: 'uuid_generate_v4',
            returns: 'text',
            implementation: () => randomUUID(),
            impure: true,
          });
          db.public.none(`
            CREATE SCHEMA IF NOT EXISTS information_schema;
            CREATE TABLE IF NOT EXISTS information_schema.columns (
              table_catalog text,
              table_schema text,
              table_name text,
              column_name text,
              ordinal_position integer,
              column_default text,
              is_nullable text,
              data_type text,
              udt_schema text,
              udt_name text
            );
          `);
          dataSource = db.adapters.createTypeormDataSource({
            type: 'postgres',
            entities: [
              BonusOptionEntity,
              BonusEntity,
              BonusDefaultEntity,
              Transaction,
              TransactionType,
            ],
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([
        BonusOptionEntity,
        BonusEntity,
        BonusDefaultEntity,
        Transaction,
        TransactionType,
      ]),
    ],
    controllers: [AdminBonusController],
    providers: [BonusService, { provide: ConfigService, useValue: configMock }],
  })
  class BonusTestModule {}
  return BonusTestModule;
}

describe('AdminBonusController', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const BonusTestModule = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [BonusTestModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    dataSource = moduleRef.get(DataSource);
    await app.init();

    const repo = dataSource.getRepository(BonusOptionEntity);
    await repo.insert(bonusEntities());
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns bonus options', async () => {
    await request(app.getHttpServer())
      .get('/admin/bonus/options')
      .expect(200)
      .expect(expectedOptions());
  });

  it('returns bonus defaults', async () => {
    const {
      bonusPercent: _bonusPercent,
      maxBonusUsd: _maxBonusUsd,
      ...responseDefaults
    } = expectedDefaults();

    await request(app.getHttpServer())
      .get('/admin/bonus/defaults')
      .expect(200)
      .expect(({ body }) => {
        const { expiryDate: _expiryDate, ...rest } = responseDefaults;
        expect(body).toMatchObject(rest);
        expect(body.bonusPercent).toBeUndefined();
        expect(body.maxBonusUsd).toBeUndefined();
      });
  });

  it('returns bonus stats', async () => {
    const bonusRepo = dataSource.getRepository(BonusEntity);
    const txRepo = dataSource.getRepository(Transaction);
    const txTypeRepo = dataSource.getRepository(TransactionType);

    await txRepo.query('DELETE FROM "wallet_transaction"');
    await txTypeRepo.query('DELETE FROM "transaction_type"');
    await bonusRepo.clear();

    await txTypeRepo.insert({ id: 'bonus', label: 'Bonus' });

    await bonusRepo.save([
      bonusRepo.create({
        name: 'Active Bonus',
        type: 'deposit',
        description: 'desc',
        bonusPercent: null,
        maxBonusUsd: null,
        expiryDate: null,
        eligibility: 'all',
        status: 'active',
        claimsTotal: 15,
        claimsWeek: 6,
      }),
      bonusRepo.create({
        name: 'Expired Bonus',
        type: 'deposit',
        description: 'desc',
        bonusPercent: null,
        maxBonusUsd: null,
        expiryDate: '2000-01-01',
        eligibility: 'all',
        status: 'active',
        claimsTotal: 5,
        claimsWeek: 4,
      }),
    ]);

    await txRepo.save([
      txRepo.create({
        userId: 'user-1',
        typeId: 'bonus',
        amount: 3000,
        performedBy: 'system',
        notes: 'paid',
        status: 'Completed',
      }),
      txRepo.create({
        userId: 'user-2',
        typeId: 'bonus',
        amount: 1500,
        performedBy: 'system',
        notes: 'paid',
        status: 'confirmed',
      }),
      txRepo.create({
        userId: 'user-3',
        typeId: 'bonus',
        amount: 1200,
        performedBy: 'system',
        notes: 'pending',
        status: 'pending',
      }),
    ]);

    await request(app.getHttpServer())
      .get('/admin/bonus/stats')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          activeBonuses: 1,
          weeklyClaims: 10,
          completedPayouts: 45,
          currency: 'USD',
          conversionRate: 20,
        });
      });
  });
});
