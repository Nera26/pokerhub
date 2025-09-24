import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminTournamentsController } from '../src/routes/admin-tournaments.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { TournamentService } from '../src/tournament/tournament.service';

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
});
