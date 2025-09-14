import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminTournamentsController } from '../src/routes/admin-tournaments.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { TournamentSimulateResponseSchema } from '@shared/types';
import { TournamentService } from '../src/tournament/tournament.service';

jest.mock('../src/services/tournamentSimulator', () => ({
  simulate: () => ({ averageDuration: 1, durationVariance: 0 }),
}));

describe('AdminTournamentsController simulate', () => {
  let app: INestApplication;

  const svc: Partial<TournamentService> = {
    getBotProfiles: jest
      .fn()
      .mockResolvedValue([
        { name: 'test', proportion: 1, bustMultiplier: 1 },
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

  it('rejects invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/admin/tournaments/simulate')
      .send({})
      .expect(400);
  });

  it('returns simulation result', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/tournaments/simulate')
      .send({
        levels: 1,
        levelMinutes: 1,
        increment: 1,
        entrants: 2,
        runs: 1,
      })
      .expect(200);
    const parsed = TournamentSimulateResponseSchema.parse(res.body);
    expect(parsed).toEqual({ averageDuration: 1, durationVariance: 0 });
  });
});
