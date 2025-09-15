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
      { lang: 'en', key: 'searchPlaceholder', value: 'Search...' },
      { lang: 'es', key: 'searchPlaceholder', value: 'Buscar...' },
      { lang: 'en', key: 'noResultsFound', value: 'No results found' },
      {
        lang: 'es',
        key: 'noResultsFound',
        value: 'No se encontraron resultados',
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns translations for supported language', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const res = await request(server).get('/translations/es').expect(200);
    const body = res.body as { messages: Record<string, string> };
    expect(body.messages['login.title']).toBe('Iniciar sesión');
    expect(body.messages.searchPlaceholder).toBe('Buscar...');
    expect(body.messages.noResultsFound).toBe('No se encontraron resultados');
  });

  it('falls back to English for unsupported language', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const res = await request(server).get('/translations/fr').expect(200);
    const body = res.body as { messages: Record<string, string> };
    expect(body.messages['login.title']).toBe('Login');
    expect(body.messages.searchPlaceholder).toBe('Search...');
    expect(body.messages.noResultsFound).toBe('No results found');
  });

  it('sets cache headers', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const res = await request(server).get('/translations/en').expect(200);
    expect(res.headers['cache-control']).toBe(`public, max-age=${CACHE_TTL}`);
  });

  it('handles service errors', async () => {
    const svc = app.get(TranslationsService);
    jest.spyOn(svc, 'get').mockRejectedValueOnce(new Error('boom'));
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server).get('/translations/en').expect(500);
  });
});
