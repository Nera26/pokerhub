import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TournamentController } from '../src/tournament/tournament.controller';
import { TournamentService } from '../src/tournament/tournament.service';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';
import { AuthGuard } from '../src/auth/auth.guard';

describe('TournamentController', () => {
  let app: INestApplication;
  const svc = {
    cancel: jest.fn().mockResolvedValue(undefined),
    register: jest.fn(),
    withdraw: jest.fn(),
    scheduleTournament: jest.fn(),
  } as Partial<TournamentService>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TournamentController],
      providers: [{ provide: TournamentService, useValue: svc }],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('cancels tournament', async () => {
    await request(app.getHttpServer())
      .post('/tournaments/abc/cancel')
      .expect(200);
    expect(svc.cancel).toHaveBeenCalledWith('abc');
  });

  it('registers player', async () => {
    svc.register?.mockResolvedValue({ id: 'seat1' } as any);
    await request(app.getHttpServer())
      .post('/tournaments/t1/register')
      .send({ userId: 'u1' })
      .expect(201);
    expect(svc.register).toHaveBeenCalledWith('t1', 'u1');
  });

  it('withdraws player', async () => {
    svc.withdraw?.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .post('/tournaments/t1/withdraw')
      .send({ userId: 'u1' })
      .expect(200);
    expect(svc.withdraw).toHaveBeenCalledWith('t1', 'u1');
  });

  it('schedules tournament', async () => {
    svc.scheduleTournament?.mockResolvedValue(undefined);
    const now = new Date();
    const payload = {
      startTime: now.toISOString(),
      registration: { open: now.toISOString(), close: now.toISOString() },
      structure: [{ level: 1, durationMinutes: 10 }],
      breaks: [{ start: now.toISOString(), durationMs: 60000 }],
    };
    await request(app.getHttpServer())
      .post('/tournaments/t1/schedule')
      .send(payload)
      .expect(200);
    expect(svc.scheduleTournament).toHaveBeenCalledWith('t1', {
      registration: {
        open: new Date(payload.registration.open),
        close: new Date(payload.registration.close),
      },
      structure: [{ level: 1, durationMinutes: 10 }],
      breaks: [{ start: new Date(payload.breaks[0].start), durationMs: 60000 }],
      start: new Date(payload.startTime),
    });
  });
});
