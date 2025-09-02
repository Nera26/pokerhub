import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TournamentController } from '../../src/tournament/tournament.controller';
import { TournamentService } from '../../src/tournament/tournament.service';
import { AuthGuard } from '../../src/auth/auth.guard';
import { SessionService } from '../../src/session/session.service';
import { RateLimitGuard } from '../../src/routes/rate-limit.guard';

describe('TournamentController auth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TournamentController],
      providers: [
        { provide: TournamentService, useValue: {} },
        AuthGuard,
        { provide: SessionService, useValue: { verifyAccessToken: jest.fn() } },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated registration', async () => {
    await request(app.getHttpServer())
      .post('/tournaments/t1/register')
      .send({ userId: 'u1' })
      .expect(401);
  });
});
