process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { TranslationsController } from '../src/routes/translations.controller';
import {
  CACHE_TTL,
  TranslationsService,
} from '../src/services/translations.service';
import { TranslationEntity } from '../src/database/entities/translation.entity';

describe('TranslationsController', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
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
              entities: [TranslationEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([TranslationEntity]),
      ],
      controllers: [TranslationsController],
      providers: [TranslationsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(TranslationEntity);
    await repo.insert([
      { lang: 'en', key: 'login.title', value: 'Login' },
      { lang: 'es', key: 'login.title', value: 'Iniciar sesión' },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns translations for supported language', async () => {
    const res = await request(app.getHttpServer())
      .get('/translations/es')
      .expect(200);
    expect(res.body.messages['login.title']).toBe('Iniciar sesión');
  });

  it('falls back to English for unsupported language', async () => {
    const res = await request(app.getHttpServer())
      .get('/translations/fr')
      .expect(200);
    expect(res.body.messages['login.title']).toBe('Login');
  });

  it('sets cache headers', async () => {
    const res = await request(app.getHttpServer())
      .get('/translations/en')
      .expect(200);
    expect(res.headers['cache-control']).toBe(`public, max-age=${CACHE_TTL}`);
  });

  it('handles service errors', async () => {
    const svc = app.get(TranslationsService);
    jest.spyOn(svc, 'get').mockRejectedValueOnce(new Error('boom'));
    await request(app.getHttpServer())
      .get('/translations/en')
      .expect(500);
  });
});
