import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MonitoringController } from '../../src/metrics/monitoring.controller';
import { MetricsWriterService } from '../../src/metrics/metrics-writer.service';
import { ZodExceptionFilter } from '../../src/common/zod-exception.filter';
import { createInMemoryRedis } from '../utils/mock-redis';

describe('MonitoringController (integration)', () => {
  let app: INestApplication;
  const context = createInMemoryRedis();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        MetricsWriterService,
        { provide: 'REDIS_CLIENT', useValue: context.redis },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('stores samples in redis', async () => {
    await request(app.getHttpServer())
      .post('/monitoring')
      .send({ name: 'CLS', value: 0.23, overThreshold: true })
      .expect(202)
      .expect({ status: 'accepted' });

    const key = 'metrics:web-vitals:cls';
    const list = context.store.lists.get(key);
    expect(list).toBeDefined();
    expect(list).toHaveLength(1);
    const sample = JSON.parse(list![0]) as {
      value: number;
      overThreshold: boolean;
      recordedAt: number;
    };
    expect(sample).toMatchObject({ value: 0.23, overThreshold: true });
    expect(typeof sample.recordedAt).toBe('number');
  });
});
