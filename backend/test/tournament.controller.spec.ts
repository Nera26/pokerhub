import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { TournamentController } from '../src/tournament/tournament.controller';
import { TournamentService } from '../src/tournament/tournament.service';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('TournamentController', () => {
  let app: INestApplication;
  const svc = {
    cancel: jest.fn().mockResolvedValue(undefined),
    join: jest.fn(),
    withdraw: jest.fn(),
    scheduleTournament: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
  } as Partial<TournamentService>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TournamentController],
      providers: [{ provide: TournamentService, useValue: svc }],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          const header = req.headers['authorization'];
          if (typeof header === 'string' && header.startsWith('Bearer ')) {
            req.userId = header.slice(7);
            return true;
          }
          return false;
        },
      })
      .overrideGuard(AdminGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const header = ctx.switchToHttp().getRequest().headers['authorization'];
          return typeof header === 'string' && header == 'Bearer admin';
        },
      })
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
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(svc.cancel).toHaveBeenCalledWith('abc');
  });
  it('rejects non-admin cancel', async () => {
    await request(app.getHttpServer())
      .post('/tournaments/abc/cancel')
      .set('Authorization', 'Bearer u1')
      .expect(403);
  });

  it('lists tournaments with state and gameType', async () => {
    svc.list?.mockResolvedValue([
      {
        id: 't1',
        title: 'T1',
        buyIn: 100,
        prizePool: 1000,
        state: 'REG_OPEN',
        gameType: 'texas',
        players: { current: 0, max: 100 },
        registered: false,
      },
    ]);
    const res = await request(app.getHttpServer()).get('/tournaments').expect(200);
    expect(res.body[0]).toMatchObject({ state: 'REG_OPEN', gameType: 'texas' });
  });

  it('gets tournament with state and gameType', async () => {
    svc.get?.mockResolvedValue({
      id: 't1',
      title: 'T1',
      buyIn: 100,
      prizePool: 1000,
      state: 'REG_OPEN',
      gameType: 'texas',
      players: { current: 0, max: 100 },
      registered: false,
      registration: { open: null, close: null },
      overview: [],
      structure: [],
      prizes: [],
    });
    const res = await request(app.getHttpServer()).get('/tournaments/t1').expect(200);
    expect(res.body).toMatchObject({ id: 't1', state: 'REG_OPEN', gameType: 'texas' });
  });


  it('registers player', async () => {
    svc.join?.mockResolvedValue({ id: 'seat1' } as any);
    await request(app.getHttpServer())
      .post('/tournaments/t1/register')
      .set('Authorization', 'Bearer u1')
      .expect(201);
    expect(svc.join).toHaveBeenCalledWith('t1', 'u1');
  });

  it('withdraws player', async () => {
    svc.withdraw?.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .post('/tournaments/t1/withdraw')
      .set('Authorization', 'Bearer u1')
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
      .set('Authorization', 'Bearer admin')
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

  it('rejects non-admin schedule', async () => {
    const now = new Date();
    const payload = {
      startTime: now.toISOString(),
      registration: { open: now.toISOString(), close: now.toISOString() },
      structure: [{ level: 1, durationMinutes: 10 }],
      breaks: [{ start: now.toISOString(), durationMs: 60000 }],
    };
    await request(app.getHttpServer())
      .post('/tournaments/t1/schedule')
      .set('Authorization', 'Bearer u1')
      .send(payload)
      .expect(403);
  });

});
