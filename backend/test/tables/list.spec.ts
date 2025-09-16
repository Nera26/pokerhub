process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { TablesController } from '../../src/routes/tables.controller';
import { TablesService } from '../../src/game/tables.service';
import { Table } from '../../src/database/entities/table.entity';
import { TableDataSchema } from '@shared/types';
import { listTables } from '../utils/table';

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
          dataSource = db.adapters.createTypeormDataSource({
            type: 'postgres',
            entities: [Table],
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([Table]),
    ],
    controllers: [TablesController],
    providers: [TablesService],
  })
  class TablesTestModule {}
  return TablesTestModule;
}

describe('TablesController', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let tableId: string;

  beforeAll(async () => {
    const TablesTestModule = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TablesTestModule],
    }).compile();
    app = moduleRef.createNestApplication();
    dataSource = moduleRef.get(DataSource);
    await app.init();

    const repo = dataSource.getRepository(Table);
    const saved = await repo.save({
      name: 'Test Table',
      gameType: 'texas',
      smallBlind: 1,
      bigBlind: 2,
      startingStack: 100,
      playersMax: 6,
      minBuyIn: 40,
      maxBuyIn: 200,
    });
    tableId = saved.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns lobby tables', async () => {
    const tables = await listTables(app);
    expect(tables).toHaveLength(1);
    expect(tables[0].tableName).toBe('Test Table');
  });

  it('filters by active status', async () => {
    const tables = await listTables(app, { status: 'active' });
    expect(tables).toHaveLength(0);
  });

  it('returns table data', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tables/${tableId}`)
      .expect(200);
    const parsed = TableDataSchema.parse(res.body);
    expect(parsed.smallBlind).toBe(1);
    expect(parsed.bigBlind).toBe(2);
  });
});
