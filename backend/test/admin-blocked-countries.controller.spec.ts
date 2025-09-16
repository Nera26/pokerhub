process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import {
  BlockedCountrySchema,
  BlockedCountriesResponseSchema,
} from '@shared/types';
import { AdminBlockedCountriesController } from '../src/routes/admin-blocked-countries.controller';
import { BlockedCountriesService } from '../src/services/blocked-countries.service';
import { BlockedCountryEntity } from '../src/database/entities/blocked-country.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { KycService } from '../src/common/kyc.service';

describe('AdminBlockedCountriesController', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let refreshMock: jest.Mock;

  beforeAll(async () => {
    refreshMock = jest.fn().mockResolvedValue([]);
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
              entities: [BlockedCountryEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([BlockedCountryEntity]),
      ],
      controllers: [AdminBlockedCountriesController],
      providers: [
        BlockedCountriesService,
        { provide: KycService, useValue: { refreshBlockedCountries: refreshMock } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(BlockedCountryEntity);
    await repo.insert([
      { country: 'US' },
      { country: 'GB' },
    ]);
  });

  beforeEach(() => {
    refreshMock.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists blocked countries', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/blocked-countries')
      .expect(200);
    const body = BlockedCountriesResponseSchema.parse(res.body);
    expect(body).toEqual([
      { country: 'GB' },
      { country: 'US' },
    ]);
  });

  it('creates a blocked country', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/blocked-countries')
      .send({ country: 'ca' })
      .expect(200);
    expect(BlockedCountrySchema.parse(res.body)).toEqual({ country: 'CA' });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    const repo = dataSource.getRepository(BlockedCountryEntity);
    expect(await repo.findOne({ where: { country: 'CA' } })).toBeTruthy();
  });

  it('updates a blocked country', async () => {
    const res = await request(app.getHttpServer())
      .put('/admin/blocked-countries/us')
      .send({ country: 'ua' })
      .expect(200);
    expect(BlockedCountrySchema.parse(res.body)).toEqual({ country: 'UA' });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    const repo = dataSource.getRepository(BlockedCountryEntity);
    expect(await repo.findOne({ where: { country: 'UA' } })).toBeTruthy();
  });

  it('removes a blocked country', async () => {
    await request(app.getHttpServer())
      .delete('/admin/blocked-countries/gb')
      .expect(204);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    const repo = dataSource.getRepository(BlockedCountryEntity);
    expect(await repo.findOne({ where: { country: 'GB' } })).toBeNull();
  });
});
