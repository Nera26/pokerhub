import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TournamentModule } from '../../src/tournament/tournament.module';

describe('TournamentController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TournamentModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('calculates prizes', () => {
    return request(app.getHttpServer())
      .post('/tournaments/prizes')
      .send({ prizePool: 1000, payouts: [0.5, 0.3, 0.2] })
      .expect(200)
      .expect({ prizes: [500, 300, 200] });
  });
});
