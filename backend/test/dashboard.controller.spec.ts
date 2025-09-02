import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DashboardController } from '../src/routes/dashboard.controller';
import { DashboardService } from '../src/metrics/dashboard.service';

describe('DashboardController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            mget: jest.fn().mockResolvedValue(['5', '1234']),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns dashboard metrics', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/metrics')
      .expect(200)
      .expect({ online: 5, revenue: 1234 });
  });
});
