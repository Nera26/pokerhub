process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { SettingsController } from '../src/routes/settings.controller';
import { SettingsService } from '../src/services/settings.service';
import { ChartPaletteEntity } from '../src/database/entities/chart-palette.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('SettingsController (integration)', () => {
  let app: INestApplication;
  let dataSource!: DataSource;

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
              entities: [ChartPaletteEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([ChartPaletteEntity]),
      ],
      controllers: [SettingsController],
      providers: [SettingsService],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('updates chart palette and persists values', async () => {
    await request(app.getHttpServer())
      .put('/settings/chart-palette')
      .send(['#111111', '#222222'])
      .expect(200)
      .expect(['#111111', '#222222']);

    const repo = dataSource.getRepository(ChartPaletteEntity);
    const rows = await repo.find({ order: { id: 'ASC' } });
    expect(rows.map((row) => row.color)).toEqual(['#111111', '#222222']);

    await request(app.getHttpServer())
      .get('/settings/chart-palette')
      .expect(200)
      .expect(['#111111', '#222222']);
  });
});
