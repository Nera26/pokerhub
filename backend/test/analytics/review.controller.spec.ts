import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ReviewController } from '../../src/analytics/review.controller';
import { CollusionService } from '../../src/analytics/collusion.service';
import { CollusionController } from '../../src/analytics/collusion.controller';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { AdminGuard } from '../../src/auth/admin.guard';
import { createInMemoryRedis } from '../utils/mock-redis';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CollusionAudit } from '../../src/analytics/collusion-audit.entity';

describe('ReviewController', () => {
  let app: INestApplication;
  let service: CollusionService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => '00000000-0000-0000-0000-000000000000',
    });
    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [CollusionAudit],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const repo = dataSource.getRepository(CollusionAudit);

    const { redis } = createInMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      controllers: [ReviewController, CollusionController],
      providers: [
        CollusionService,
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: getRepositoryToken(CollusionAudit), useValue: repo },
        {
          provide: AnalyticsService,
          useValue: { ingest: jest.fn(), emitAntiCheatFlag: jest.fn() },
        },
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
    await dataSource.destroy();
  });

  it('transitions session statuses via actions', async () => {
    await service.flagSession('s1', ['a', 'b'], {});

    const warnRes = await request(app.getHttpServer())
      .post('/analytics/collusion/s1/warn')
      .expect(201);
    expect(warnRes.body).toMatchObject({ action: 'warn', reviewerId: 'admin1' });
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

