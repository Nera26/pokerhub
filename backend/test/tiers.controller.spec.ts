process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { TiersController } from '../src/routes/tiers.controller';
import { TierService } from '../src/tiers/tier.service';
import { TierRepository } from '../src/tiers/tier.repository';
import { Tier } from '../src/database/entities/tier.entity';
import { TiersSchema } from '../src/schemas/tiers';

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
            entities: [Tier],
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([Tier]),
    ],
    controllers: [TiersController],
    providers: [TierService, TierRepository],
  })
  class TiersTestModule {}
  return TiersTestModule;
}

describe('TiersController', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const TiersTestModule = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TiersTestModule],
    }).compile();
    app = moduleRef.createNestApplication();
    dataSource = moduleRef.get(DataSource);
    await app.init();

    const repo = dataSource.getRepository(Tier);
    await repo.insert([
      { name: 'Bronze', min: 0, max: 999 },
      { name: 'Silver', min: 1000, max: 4999 },
      { name: 'Gold', min: 5000, max: 9999 },
      { name: 'Diamond', min: 10000, max: 19999 },
      { name: 'Platinum', min: 20000, max: null },
    ]);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns tier definitions', async () => {
    const res = await request(app.getHttpServer()).get('/tiers').expect(200);
    expect(TiersSchema.parse(res.body)).toEqual([
      { name: 'Bronze', min: 0, max: 999 },
      { name: 'Silver', min: 1000, max: 4999 },
      { name: 'Gold', min: 5000, max: 9999 },
      { name: 'Diamond', min: 10000, max: 19999 },
      { name: 'Platinum', min: 20000, max: null },
    ]);
  });
});
