import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MonitoringController } from '../../src/metrics/monitoring.controller';
import { MetricsWriterService } from '../../src/metrics/metrics-writer.service';
import { ZodExceptionFilter } from '../../src/common/zod-exception.filter';
import { createInMemoryRedis } from '../utils/mock-redis';

describe('MonitoringController', () => {
  let app: INestApplication;
  let service: MetricsWriterService;
  const recordSpy = jest.fn();

  beforeAll(async () => {
    const { redis } = createInMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        MetricsWriterService,
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = moduleRef.get(MetricsWriterService);
    jest.spyOn(service, 'recordWebVital').mockImplementation(recordSpy);

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  afterEach(() => {
    recordSpy.mockClear();
  });

  it('accepts valid payloads', async () => {
    await request(app.getHttpServer())
      .post('/monitoring')
      .send({ name: 'LCP', value: 1234, overThreshold: true })
      .expect(202)
      .expect({ status: 'accepted' });

    expect(recordSpy).toHaveBeenCalledWith({
      name: 'LCP',
      value: 1234,
      overThreshold: true,
    });
  });

  it('rejects invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/monitoring')
      .send({ name: 'LCP', value: 'oops' })
      .expect(400);
    expect(recordSpy).not.toHaveBeenCalled();
  });
});
