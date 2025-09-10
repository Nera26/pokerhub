import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LeaderboardController } from '../../src/leaderboard/leaderboard.controller';
import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import {
  LeaderboardRangesResponseSchema,
  LeaderboardModesResponseSchema,
} from '@shared/types';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AdminGuard } from '../../src/auth/admin.guard';

describe('LeaderboardController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [
        {
          provide: LeaderboardService,
          useValue: {
            getRanges: () => ({ ranges: ['daily', 'weekly', 'monthly'] }),
            getModes: () => ({ modes: ['cash', 'tournament'] }),
            getTopPlayers: jest.fn(),
            rebuild: jest.fn(),
          },
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns leaderboard ranges', async () => {
    const res = await request(app.getHttpServer())
      .get('/leaderboard/ranges')
      .expect(200);
    const parsed = LeaderboardRangesResponseSchema.parse(res.body);
    expect(parsed.ranges).toEqual(['daily', 'weekly', 'monthly']);
  });

  it('returns leaderboard modes', async () => {
    const res = await request(app.getHttpServer())
      .get('/leaderboard/modes')
      .expect(200);
    const parsed = LeaderboardModesResponseSchema.parse(res.body);
    expect(parsed.modes).toEqual(['cash', 'tournament']);
  });
});
