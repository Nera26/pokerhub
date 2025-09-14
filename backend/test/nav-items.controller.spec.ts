process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { NavController } from '../src/nav/nav.controller';
import { NavService } from '../src/nav/nav.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { NavItemEntity } from '../src/database/entities/nav-item.entity';
import type { NavItemsResponse } from '@shared/types';

describe('NavController', () => {
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
              entities: [NavItemEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([NavItemEntity]),
      ],
      controllers: [NavController],
      providers: [NavService],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(NavItemEntity);
    await repo.insert([
      { flag: 'lobby', href: '/', label: 'Lobby', icon: 'home', order: 1 },
      { flag: 'profile', href: '/user', label: 'Profile', icon: null, order: 2 },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns navigation items', async () => {
    const res = await request(app.getHttpServer()).get('/nav-items').expect(200);
    const body: NavItemsResponse = res.body;
    const expected: NavItemsResponse = [
      { flag: 'lobby', href: '/', label: 'Lobby', icon: 'home' },
      { flag: 'profile', href: '/user', label: 'Profile' },
    ];
    expect(body).toEqual(expected);
  });

  it('creates and deletes nav items', async () => {
    await request(app.getHttpServer())
      .post('/nav-items')
      .send({
        flag: 'help',
        href: '/help',
        label: 'Help',
        order: 3,
      })
      .expect(200);

    let res = await request(app.getHttpServer()).get('/nav-items').expect(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        { flag: 'help', href: '/help', label: 'Help' },
      ]),
    );

    await request(app.getHttpServer())
      .delete('/nav-items/help')
      .expect(204);

    res = await request(app.getHttpServer()).get('/nav-items').expect(200);
    expect(res.body).not.toContainEqual({
      flag: 'help',
      href: '/help',
      label: 'Help',
    });
  });
});
