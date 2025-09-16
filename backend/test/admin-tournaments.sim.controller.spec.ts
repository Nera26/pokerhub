import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminTournamentsController } from '../src/routes/admin-tournaments.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { TournamentSimulateResponseSchema } from '@shared/types';
import { TournamentService } from '../src/tournament/tournament.service';
import { simulate, type BlindLevel } from '@shared/utils/tournamentSimulator';

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
    const payload = {
      levels: 2,
      levelMinutes: 1,
      increment: 0.5,
      entrants: 5,
      runs: 3,
    };

    const res = await request(app.getHttpServer())
      .post('/admin/tournaments/simulate')
      .send(payload)
      .expect(200);

    const parsed = TournamentSimulateResponseSchema.parse(res.body);

    const structure: BlindLevel[] = Array.from({ length: payload.levels }, (_, i) => ({
      level: i + 1,
      durationMinutes: payload.levelMinutes,
      blindMultiplier: 1 + i * payload.increment,
    }));

    const expected = simulate(structure, payload.entrants, payload.runs, [
      { name: 'test', proportion: 1, bustMultiplier: 1 },
    ]);

    expect(parsed.averageDuration).toBeCloseTo(expected.averageDuration);
    expect(parsed.durationVariance).toBeCloseTo(expected.durationVariance);
  });
});
