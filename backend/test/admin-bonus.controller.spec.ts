process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { AdminBonusController } from '../src/routes/admin-bonus.controller';
import { BonusService } from '../src/services/bonus.service';
import { BonusOptionEntity } from '../src/database/entities/bonus-option.entity';
import { BonusEntity } from '../src/database/entities/bonus.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { bonusEntities, expectedOptions, expectedDefaults } from './bonus/fixtures';

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
            entities: [BonusOptionEntity, BonusEntity],
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([BonusOptionEntity, BonusEntity]),
    ],
    controllers: [AdminBonusController],
    providers: [BonusService],
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
      .expect(responseDefaults)
      .expect(({ body }) => {
        expect(body.bonusPercent).toBeUndefined();
        expect(body.maxBonusUsd).toBeUndefined();
      });
  });
});
