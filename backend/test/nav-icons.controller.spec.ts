process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { NavIconsController } from '../src/routes/nav-icons.controller';
import { AdminNavIconsController } from '../src/routes/admin-nav-icons.controller';
import { NavIconsService } from '../src/services/nav-icons.service';
import { NavIconEntity } from '../src/database/entities/nav-icon.entity';
import { NavIcons1757058400005 } from '../src/database/migrations/1757058400005-NavIcons';
import {
  NAV_ICON_DATA,
  SeedNavIcons1757058400017,
} from '../src/database/migrations/1757058400017-SeedNavIcons';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
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
            const options = {
              type: 'postgres',
              entities: [NavIconEntity],
              synchronize: false,
            } as const;
            dataSource = db.adapters.createTypeormDataSource(options) as DataSource;
            return options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([NavIconEntity]),
      ],
        controllers: [NavIconsController, AdminNavIconsController],
        providers: [NavIconsService],
      })
        .overrideGuard(AuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(AdminGuard)
        .useValue({ canActivate: () => true })
        .compile();

    app = moduleRef.createNestApplication();
    service = moduleRef.get(NavIconsService);
    await app.init();

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await new NavIcons1757058400005().up(queryRunner);
      await new SeedNavIcons1757058400017().up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('returns navigation icons', async () => {
    const listSpy = jest.spyOn(service, 'listValidated');
    const res = await request(app.getHttpServer())
      .get('/nav-icons')
      .expect(200);
    expect(listSpy).toHaveBeenCalledTimes(1);
    const body = NavIconsResponseSchema.parse(res.body);
    const expected: NavIconsResponse = NAV_ICON_DATA.map((icon) => ({ ...icon }));
    body.sort((a, b) => a.name.localeCompare(b.name));
    expected.sort((a, b) => a.name.localeCompare(b.name));
    expect(body).toEqual(expected);
  });

  it('returns navigation icons for admin route', async () => {
    const listSpy = jest.spyOn(service, 'listValidated');
    const res = await request(app.getHttpServer())
      .get('/admin/nav-icons')
      .expect(200);
    expect(listSpy).toHaveBeenCalledTimes(1);
    const body = NavIconsResponseSchema.parse(res.body);
    const expected: NavIconsResponse = NAV_ICON_DATA.map((icon) => ({ ...icon }));
    body.sort((a, b) => a.name.localeCompare(b.name));
    expected.sort((a, b) => a.name.localeCompare(b.name));
    expect(body).toEqual(expected);
  });

  it('creates a navigation icon', async () => {
    const icon: NavIcon = {
      name: 'custom',
      svg: '<svg viewBox="0 0 32 32"><path d="M0 0h32v32H0z"/></svg>',
    };
    const res = await request(app.getHttpServer())
      .post('/admin/nav-icons')
      .send(icon)
      .expect(200);
    expect(NavIconSchema.parse(res.body)).toEqual(icon);
    const repo = dataSource.getRepository(NavIconEntity);
    expect(await repo.findOne({ where: { name: 'custom' } })).toBeTruthy();

    const list = await request(app.getHttpServer()).get('/nav-icons').expect(200);
    const icons = NavIconsResponseSchema.parse(list.body);
    expect(icons).toEqual(expect.arrayContaining([icon]));
  });

  it('updates a navigation icon', async () => {
    const res = await request(app.getHttpServer())
      .put('/admin/nav-icons/home')
      .send({
        name: 'home',
        svg: '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>',
      })
      .expect(200);
    expect(NavIconSchema.parse(res.body)).toEqual({
      name: 'home',
      svg: '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>',
    });
  });

  it('deletes a navigation icon', async () => {
    await request(app.getHttpServer())
      .delete('/admin/nav-icons/wallet')
      .expect(204);
    const repo = dataSource.getRepository(NavIconEntity);
    expect(await repo.findOne({ where: { name: 'wallet' } })).toBeNull();
  });
});
