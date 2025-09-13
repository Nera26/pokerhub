process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { NavIconsController } from '../src/routes/nav-icons.controller';
import { NavIconsService } from '../src/services/nav-icons.service';
import { NavIconEntity } from '../src/database/entities/nav-icon.entity';
import type { NavIconsResponse } from '@shared/types';

describe('NavIconsController', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: NavIconsService;

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
              entities: [NavIconEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([NavIconEntity]),
      ],
      controllers: [NavIconsController],
      providers: [NavIconsService],
    }).compile();

    app = moduleRef.createNestApplication();
    service = moduleRef.get(NavIconsService);
    await app.init();

    const repo = dataSource.getRepository(NavIconEntity);
    await repo.insert([
      { name: 'foo', svg: '<svg>foo</svg>' },
      { name: 'bar', svg: '<svg>bar</svg>' },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns navigation icons', async () => {
    const listSpy = jest.spyOn(service, 'list');
    const res = await request(app.getHttpServer())
      .get('/nav-icons')
      .expect(200);
    expect(listSpy).toHaveBeenCalledTimes(1);
    const body = res.body as unknown as NavIconsResponse;
    const expected: NavIconsResponse = [
      { name: 'foo', svg: '<svg>foo</svg>' },
      { name: 'bar', svg: '<svg>bar</svg>' },
    ];
    body.sort((a, b) => a.name.localeCompare(b.name));
    expected.sort((a, b) => a.name.localeCompare(b.name));
    expect(body).toEqual(expected);
  });
});
