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
import { NavIconSchema, NavIconsResponseSchema, type NavIconsResponse, type NavIcon } from '@shared/types';

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
    const body = NavIconsResponseSchema.parse(res.body);
    const expected: NavIconsResponse = [
      { name: 'foo', svg: '<svg>foo</svg>' },
      { name: 'bar', svg: '<svg>bar</svg>' },
    ];
    body.sort((a, b) => a.name.localeCompare(b.name));
    expected.sort((a, b) => a.name.localeCompare(b.name));
    expect(body).toEqual(expected);
  });

  it('creates a navigation icon', async () => {
    const icon: NavIcon = { name: 'baz', svg: '<svg>baz</svg>' };
    const res = await request(app.getHttpServer())
      .post('/nav-icons')
      .send(icon)
      .expect(200);
    expect(NavIconSchema.parse(res.body)).toEqual(icon);
    const repo = dataSource.getRepository(NavIconEntity);
    expect(await repo.findOne({ where: { name: 'baz' } })).toBeTruthy();
  });

  it('updates a navigation icon', async () => {
    const res = await request(app.getHttpServer())
      .put('/nav-icons/foo')
      .send({ name: 'foo', svg: '<svg>updated</svg>' })
      .expect(200);
    expect(NavIconSchema.parse(res.body)).toEqual({ name: 'foo', svg: '<svg>updated</svg>' });
  });

  it('deletes a navigation icon', async () => {
    await request(app.getHttpServer())
      .delete('/nav-icons/bar')
      .expect(204);
    const repo = dataSource.getRepository(NavIconEntity);
    expect(await repo.findOne({ where: { name: 'bar' } })).toBeNull();
  });
});
