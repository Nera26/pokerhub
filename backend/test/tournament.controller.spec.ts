import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TournamentController } from '../src/tournament/tournament.controller';
import { TournamentService } from '../src/tournament/tournament.service';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';

describe('TournamentController', () => {
  let app: INestApplication;
  const svc = { cancel: jest.fn().mockResolvedValue(undefined) } as Partial<TournamentService>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TournamentController],
      providers: [{ provide: TournamentService, useValue: svc }],
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

  it('cancels tournament', async () => {
    await request(app.getHttpServer())
      .post('/tournaments/abc/cancel')
      .expect(200);
    expect(svc.cancel).toHaveBeenCalledWith('abc');
  });
});
