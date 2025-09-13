import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminTournamentsController } from '../src/routes/admin-tournaments.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('AdminTournamentsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminTournamentsController],
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
      .expect(['Regular', 'Turbo', 'Deepstack', 'Bounty', 'Freeroll']);
  });

  it('returns defaults', async () => {
    await request(app.getHttpServer())
      .get('/admin/tournaments/defaults')
      .expect(200)
      .expect({
        id: 0,
        name: '',
        gameType: "Texas Hold'em",
        buyin: 0,
        fee: 0,
        prizePool: 0,
        date: '',
        time: '',
        format: 'Regular',
        seatCap: '',
        description: '',
        rebuy: false,
        addon: false,
        status: 'scheduled',
      });
  });
});
