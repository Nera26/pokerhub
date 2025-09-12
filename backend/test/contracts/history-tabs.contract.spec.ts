process.env.DATABASE_URL = '';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { HistoryTabsResponseSchema } from '@shared/types';
import { HistoryTabsController } from '../../src/routes/history-tabs.controller';
import { HistoryTabsService } from '../../src/services/history-tabs.service';
import { HistoryTabEntity } from '../../src/database/entities/history-tab.entity';

describe('Contract: GET /history-tabs', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
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
              entities: [HistoryTabEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([HistoryTabEntity]),
      ],
      controllers: [HistoryTabsController],
      providers: [HistoryTabsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(HistoryTabEntity);
    await repo.insert([
      { key: 'game-history', label: 'Game History', order: 1 },
      { key: 'tournament-history', label: 'Tournament History', order: 2 },
      { key: 'transaction-history', label: 'Deposit/Withdraw', order: 3 },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches shared schema and OpenAPI spec', async () => {
    const res = await request(app.getHttpServer())
      .get('/history-tabs')
      .expect(200);
    const parsed = HistoryTabsResponseSchema.parse(res.body);

    const docPath = resolve(__dirname, '../../../contracts/openapi.yaml');
    const doc = load(readFileSync(docPath, 'utf8')) as any;
    expect(
      doc.paths['/history-tabs'].get.responses['200'].content['application/json'].schema,
    ).toEqual({ $ref: '#/components/schemas/HistoryTabsResponse' });
    expect(doc.components.schemas.HistoryTabItem).toEqual({
      type: 'object',
      required: ['key', 'label'],
      properties: { key: { type: 'string' }, label: { type: 'string' } },
    });
    expect(doc.components.schemas.HistoryTabsResponse).toEqual({
      type: 'object',
      required: ['tabs'],
      properties: {
        tabs: {
          type: 'array',
          items: { $ref: '#/components/schemas/HistoryTabItem' },
        },
      },
    });
    expect(parsed.tabs.length).toBeGreaterThan(0);
  });
});
