import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ReviewController } from '../../src/analytics/review.controller';
import { CollusionService } from '../../src/analytics/collusion.service';
import { AdminGuard } from '../../src/auth/admin.guard';

class MockRedis {
  sets = new Map<string, Set<string>>();
  hashes = new Map<string, Record<string, string>>();
  lists = new Map<string, string[]>();
  async sadd(key: string, value: string) {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    this.sets.get(key)!.add(value);
  }
  async smembers(key: string) {
    return Array.from(this.sets.get(key) ?? []);
  }
  async hset(key: string, obj: Record<string, string>) {
    if (!this.hashes.has(key)) this.hashes.set(key, {});
    Object.assign(this.hashes.get(key)!, obj);
  }
  async hget(key: string, field: string) {
    return this.hashes.get(key)?.[field] ?? null;
  }
  async hgetall(key: string) {
    return this.hashes.get(key) ?? {};
  }
  async rpush(key: string, value: string) {
    if (!this.lists.has(key)) this.lists.set(key, []);
    this.lists.get(key)!.push(value);
  }
}

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
      .useValue({ canActivate: () => true })
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
  });
});

