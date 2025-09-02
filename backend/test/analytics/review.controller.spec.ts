import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ReviewController } from '../../src/analytics/review.controller';
import { CollusionService } from '../../src/analytics/collusion.service';
import { AdminGuard } from '../../src/auth/admin.guard';
import { MockRedis } from '../utils/mock-redis';

describe('ReviewController', () => {
  let app: INestApplication;
  let service: CollusionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        CollusionService,
        { provide: 'REDIS_CLIENT', useClass: MockRedis },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().userId = 'admin1';
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    service = moduleRef.get(CollusionService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('transitions session statuses via actions', async () => {
    await service.flagSession('s1', ['a', 'b'], {});

    await request(app.getHttpServer())
      .post('/analytics/collusion/s1/warn')
      .expect(201);
    let res = await request(app.getHttpServer())
      .get('/analytics/collusion/flagged?status=warn')
      .expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({ id: 's1', status: 'warn' }),
    ]);

    await request(app.getHttpServer())
      .post('/analytics/collusion/s1/restrict')
      .expect(201);
    res = await request(app.getHttpServer())
      .get('/analytics/collusion/flagged?status=restrict')
      .expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({ id: 's1', status: 'restrict' }),
    ]);

    await request(app.getHttpServer())
      .post('/analytics/collusion/s1/ban')
      .expect(201);
    res = await request(app.getHttpServer())
      .get('/analytics/collusion/flagged?status=ban')
      .expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({ id: 's1', status: 'ban' }),
    ]);

    const audit = await request(app.getHttpServer())
      .get('/analytics/collusion/s1/audit')
      .expect(200);
    expect(audit.body[0]).toMatchObject({ reviewerId: 'admin1' });
  });
});

