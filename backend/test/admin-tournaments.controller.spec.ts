process.env.DATABASE_URL = '';

import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { newDb } from 'pg-mem';
import { AdminTournamentsController } from '../src/routes/admin-tournaments.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { TournamentService } from '../src/tournament/tournament.service';
import { AdminTournamentFilterEntity } from '../src/tournament/admin-tournament-filter.entity';

describe('AdminTournamentsController', () => {
  let app: INestApplication;
  const defaults = {
    id: 1,
    name: 'Default',
    gameType: "Texas Hold'em",
    buyin: 100,
    fee: 10,
    prizePool: 1000,
    date: '2024-01-01',
    time: '10:00',
    format: 'Regular' as const,
    seatCap: 9,
    description: 'desc',
    rebuy: true,
    addon: false,
    status: 'scheduled' as const,
  };
  const svc: Partial<TournamentService> = {
    listFormats: jest.fn().mockResolvedValue([
      { id: 'Regular', label: 'Regular' },
      { id: 'Turbo', label: 'Turbo' },
    ]),
    getDefaultTournament: jest.fn().mockResolvedValue(defaults),
    getAdminFilterOptions: jest.fn().mockResolvedValue([
      { id: 'all', label: 'All' },
      { id: 'scheduled', label: 'Scheduled', colorClass: 'border-blue' },
    ]),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminTournamentsController],
      providers: [{ provide: TournamentService, useValue: svc }],
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
    await app.close();
  });

  it('returns formats', async () => {
    await request(app.getHttpServer())
      .get('/admin/tournaments/formats')
      .expect(200)
      .expect([
        { id: 'Regular', label: 'Regular' },
        { id: 'Turbo', label: 'Turbo' },
      ]);
    expect(svc.listFormats).toHaveBeenCalled();
  });

  it('returns defaults', async () => {
    await request(app.getHttpServer())
      .get('/admin/tournaments/defaults')
      .expect(200)
      .expect(defaults);
    expect(svc.getDefaultTournament).toHaveBeenCalled();
  });

  it('returns filters', async () => {
    await request(app.getHttpServer())
      .get('/admin/tournaments/filters')
      .expect(200)
      .expect([
        { id: 'all', label: 'All' },
        { id: 'scheduled', label: 'Scheduled', colorClass: 'border-blue' },
      ]);
    expect(svc.getAdminFilterOptions).toHaveBeenCalled();
  });
});

describe('AdminTournamentsController filters integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let repo: Repository<AdminTournamentFilterEntity>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
              entities: [AdminTournamentFilterEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([AdminTournamentFilterEntity]),
      ],
      controllers: [AdminTournamentsController],
      providers: [
        {
          provide: TournamentService,
          useFactory: (
            adminRepo: Repository<AdminTournamentFilterEntity>,
          ) =>
            new TournamentService(
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              {} as any,
              undefined,
              undefined,
              undefined,
              adminRepo as any,
            ),
          inject: [getRepositoryToken(AdminTournamentFilterEntity)],
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repo = dataSource.getRepository(AdminTournamentFilterEntity);
  });

  afterAll(async () => {
    await app.close();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await repo.clear();
  });

  it('returns filters sourced from the database', async () => {
    await repo.insert([
      {
        id: 'all',
        label: 'Everything',
        colorClass: null,
        sortOrder: 1,
      },
      {
        id: 'running',
        label: 'Live Now',
        colorClass: 'border-custom',
        sortOrder: 2,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/admin/tournaments/filters')
      .expect(200);

    expect(res.body).toEqual([
      { id: 'all', label: 'Everything' },
      { id: 'running', label: 'Live Now', colorClass: 'border-custom' },
    ]);
  });
});
