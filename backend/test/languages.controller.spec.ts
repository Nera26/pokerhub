process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { LanguagesController } from '../src/routes/languages.controller';
import { LanguagesService } from '../src/services/languages.service';
import { LanguageEntity } from '../src/database/entities/language.entity';
import type { LanguagesResponse } from '@shared/types';

describe('LanguagesController', () => {
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
              entities: [LanguageEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([LanguageEntity]),
      ],
      controllers: [LanguagesController],
      providers: [LanguagesService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(LanguageEntity);
    await repo.insert([
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns supported languages', async () => {
    const res = await request(app.getHttpServer()).get('/languages').expect(200);
    const expected: LanguagesResponse = [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
    ];
    expect(res.body).toEqual(expected);
  });
});
