import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DashboardController } from '../src/routes/dashboard.controller';
import { DashboardService } from '../src/metrics/dashboard.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

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
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'metrics:online') return Promise.resolve('5');
              if (key === 'metrics:revenue') return Promise.resolve('1234');
              return Promise.resolve(null);
            }),
            lrange: jest.fn().mockImplementation((key: string) => {
              if (key === 'metrics:activity') return Promise.resolve(['1', '2']);
              if (key === 'metrics:errors') return Promise.resolve(['3']);
              return Promise.resolve([]);
            }),
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

  it('returns dashboard metrics', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/metrics')
      .set('Authorization', 'Bearer test')
      .expect(200)
      .expect({ online: 5, revenue: 1234, activity: [1, 2], errors: [3] });
  });
});
