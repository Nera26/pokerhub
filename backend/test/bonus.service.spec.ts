process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
          dataSource = db.adapters.createTypeormDataSource({
            type: 'postgres',
            entities: [BonusOptionEntity, BonusEntity, BonusDefaultEntity],
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
      ]),
    ],
    providers: [BonusService],
    exports: [BonusService],
  })
  class BonusTestModule {}
  return { BonusTestModule, getDataSource: () => dataSource };
}

describe('BonusService', () => {
  let service: BonusService;
  let dataSource: DataSource;
  let defaultsRepo: Repository<BonusDefaultEntity>;

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
  });

  beforeEach(async () => {
    await defaultsRepo.clear();
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
});
