process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { BonusService } from '../src/services/bonus.service';
import { BonusOptionEntity } from '../src/database/entities/bonus-option.entity';

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
            entities: [BonusOptionEntity],
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([BonusOptionEntity]),
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

  beforeAll(async () => {
    const { BonusTestModule, getDataSource } = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [BonusTestModule],
    }).compile();
    service = moduleRef.get(BonusService);
    dataSource = getDataSource();
    const app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(BonusOptionEntity);
    await repo.insert([
      { type: 'deposit', label: 'Deposit Match' },
      { type: 'rakeback', label: 'Rakeback' },
      { type: 'ticket', label: 'Tournament Tickets' },
      { type: 'rebate', label: 'Rebate' },
      { type: 'first-deposit', label: 'First Deposit Only' },
      { eligibility: 'all', label: 'All Players' },
      { eligibility: 'new', label: 'New Players Only' },
      { eligibility: 'vip', label: 'VIP Players Only' },
      { eligibility: 'active', label: 'Active Players' },
      { status: 'active', label: 'Active' },
      { status: 'paused', label: 'Paused' },
    ]);
  });

  it('lists options', async () => {
    await expect(service.listOptions()).resolves.toEqual({
      types: [
        { value: 'deposit', label: 'Deposit Match' },
        { value: 'rakeback', label: 'Rakeback' },
        { value: 'ticket', label: 'Tournament Tickets' },
        { value: 'rebate', label: 'Rebate' },
        { value: 'first-deposit', label: 'First Deposit Only' },
      ],
      eligibilities: [
        { value: 'all', label: 'All Players' },
        { value: 'new', label: 'New Players Only' },
        { value: 'vip', label: 'VIP Players Only' },
        { value: 'active', label: 'Active Players' },
      ],
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
      ],
    });
  });
});
