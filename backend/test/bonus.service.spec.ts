process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { newDb } from 'pg-mem';
import { BonusService } from '../src/services/bonus.service';
import { BonusOptionEntity } from '../src/database/entities/bonus-option.entity';
import {
  bonusEntities,
  defaultsRequest,
  expectedDefaults,
  updatedDefaultsRequest,
  expectedOptions,
} from './bonus/fixtures';
import { BonusEntity } from '../src/database/entities/bonus.entity';
import { BonusDefaultEntity } from '../src/database/entities/bonus-default.entity';
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
    providers: [BonusService, { provide: ConfigService, useValue: configMock }],
    exports: [BonusService],
  })
  class BonusTestModule {}
  return { BonusTestModule, getDataSource: () => dataSource };
}

describe('BonusService', () => {
  let service: BonusService;
  let dataSource: DataSource;
  let defaultsRepo: Repository<BonusDefaultEntity>;
  let bonusRepo: Repository<BonusEntity>;
  let txRepo: Repository<Transaction>;
  let txTypeRepo: Repository<TransactionType>;

  beforeAll(async () => {
    const { BonusTestModule, getDataSource } = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [BonusTestModule],
    }).compile();
    service = moduleRef.get(BonusService);
    dataSource = getDataSource();
    const app = moduleRef.createNestApplication();
    await app.init();

    const optionRepo = dataSource.getRepository(BonusOptionEntity);
    await optionRepo.insert(bonusEntities());
    defaultsRepo = dataSource.getRepository(BonusDefaultEntity);
    bonusRepo = dataSource.getRepository(BonusEntity);
    txRepo = dataSource.getRepository(Transaction);
    txTypeRepo = dataSource.getRepository(TransactionType);
  });

  beforeEach(async () => {
    await defaultsRepo.clear();
    await bonusRepo.clear();
    await txRepo.query('DELETE FROM "wallet_transaction"');
    await txTypeRepo.query('DELETE FROM "transaction_type"');
  });

  it('lists options', async () => {
    await expect(service.listOptions()).resolves.toEqual(expectedOptions());
  });

  it('provides default form values from database', async () => {
    await defaultsRepo.insert(defaultsRequest());
    await expect(service.getDefaults()).resolves.toEqual(expectedDefaults());
  });

  it('falls back to seeded defaults when table is empty', async () => {
    await expect(service.getDefaults()).resolves.toEqual(expectedDefaults());
  });

  it('creates defaults', async () => {
    await expect(service.createDefaults(defaultsRequest())).resolves.toEqual(
      expectedDefaults(),
    );
    await expect(defaultsRepo.count()).resolves.toBe(1);
  });

  it('updates defaults', async () => {
    await defaultsRepo.insert(defaultsRequest());
    await expect(service.updateDefaults(updatedDefaultsRequest())).resolves.toEqual(
      updatedDefaultsRequest(),
    );
  });

  it('deletes defaults', async () => {
    await defaultsRepo.insert(defaultsRequest());
    await service.deleteDefaults();
    await expect(defaultsRepo.count()).resolves.toBe(0);
  });

  it('prevents duplicate creation', async () => {
    await defaultsRepo.insert(defaultsRequest());
    await expect(service.createDefaults(defaultsRequest())).rejects.toThrow(
      'already exist',
    );
  });

  it('computes bonus statistics', async () => {
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
        claimsTotal: 10,
        claimsWeek: 5,
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
        claimsWeek: 3,
      }),
      bonusRepo.create({
        name: 'Paused Bonus',
        type: 'deposit',
        description: 'desc',
        bonusPercent: null,
        maxBonusUsd: null,
        expiryDate: null,
        eligibility: 'all',
        status: 'paused',
        claimsTotal: 2,
        claimsWeek: 2,
      }),
    ]);

    await txRepo.save([
      txRepo.create({
        userId: 'user-1',
        typeId: 'bonus',
        amount: 5000,
        performedBy: 'system',
        notes: 'approved',
        status: 'Completed',
      }),
      txRepo.create({
        userId: 'user-2',
        typeId: 'bonus',
        amount: 2500,
        performedBy: 'system',
        notes: 'approved',
        status: 'confirmed',
      }),
      txRepo.create({
        userId: 'user-3',
        typeId: 'bonus',
        amount: 1000,
        performedBy: 'system',
        notes: 'pending',
        status: 'pending',
      }),
    ]);

    await expect(service.getStats()).resolves.toEqual({
      activeBonuses: 1,
      weeklyClaims: 10,
      completedPayouts: 75,
      currency: 'USD',
      conversionRate: 20,
    });
  });
});
