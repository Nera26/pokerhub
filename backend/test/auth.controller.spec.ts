import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SessionService } from '../src/session/session.service';
import { LoginResponseSchema } from '@shared/types';
import { ConfigService } from '@nestjs/config';

class MockRedis {
  store = new Map<string, any>();
  incr(key: string) {
    const val = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, val);
    return val;
  }
  expire(key: string, _ttl: number) {
    return 0;
  }
  set(key: string, value: string) {
    this.store.set(key, value);
  }
  get(key: string) {
    return this.store.get(key) ?? null;
  }
  del(key: string) {
    this.store.delete(key);
  }
}

class MockConfigService {
  get(key: string, def?: any) {
    const map: Record<string, any> = {
      'auth.jwtSecrets': ['test-secret'],
      'auth.accessTtl': 900,
      'auth.refreshTtl': 3600,
      'rateLimit.window': 60,
      'rateLimit.max': 5,
    };
    return map[key] ?? def;
  }
}

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        SessionService,
        { provide: 'REDIS_CLIENT', useClass: MockRedis },
        { provide: ConfigService, useClass: MockConfigService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns token for valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-device-id', 'success')
      .send({ email: 'user@example.com', password: 'secret' })
      .expect(200);
    const parsed = LoginResponseSchema.parse(res.body);
    expect(parsed.token).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-device-id', 'fail')
      .send({ email: 'user@example.com', password: 'wrong' })
      .expect(401);
  });

  it('rate limits repeated attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-device-id', 'limit')
        .send({ email: 'user@example.com', password: 'wrong' })
        .expect(401);
    }
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-device-id', 'limit')
      .send({ email: 'user@example.com', password: 'wrong' })
      .expect(429);
  });
});
