import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SessionService } from '../src/session/session.service';
import { LoginResponseSchema } from '@shared/types';
import { ConfigService } from '@nestjs/config';
import { createInMemoryRedis, MockRedis } from './utils/mock-redis';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { GeoIpService } from '../src/auth/geoip.service';
import { AuthRateLimitMiddleware } from '../src/auth/rate-limit.middleware';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../src/users/user.repository';
import { EmailService } from '../src/auth/email.service';
import { MetricsWriterService } from '../src/metrics/metrics-writer.service';

class InMemoryUserRepository {
  private users: any[] = [];
  create(data: any) {
    return { id: String(this.users.length + 1), ...data };
  }
  async save(user: any) {
    this.users.push(user);
    return user;
  }
  async findOne(opts: any) {
    const email = opts?.where?.email;
    return this.users.find((u) => u.email === email) ?? null;
  }
}

class MockEmailService {
  async sendResetCode() {
    // noop
  }
}

class MockConfigService {
  get(key: string, def?: any) {
    const map: Record<string, any> = {
      'auth.jwtSecrets': ['test-secret'],
      'auth.accessTtl': 900,
      'auth.refreshTtl': 3600,
      'auth.providers': [
        { name: 'google', url: '/auth/google', label: 'Google' },
        { name: 'facebook', url: '/auth/facebook', label: 'Facebook' },
      ],
      'rateLimit.window': 60,
      'rateLimit.max': 5,
      'geo.allowedCountries': [],
    };
    return map[key] ?? def;
  }
}

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { redis } = createInMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        SessionService,
        GeoIpService,
        AuthRateLimitMiddleware,
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: AnalyticsService, useValue: { emit: jest.fn() } },
        { provide: UserRepository, useClass: InMemoryUserRepository },
        { provide: EmailService, useClass: MockEmailService },
        { provide: MetricsWriterService, useValue: { recordLogin: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    const rateLimit = app.get(AuthRateLimitMiddleware);
    app.use(rateLimit.use.bind(rateLimit));
    const repo = app.get<UserRepository>(UserRepository);
    const hash = await bcrypt.hash('secret', 10);
    await repo.save(
      repo.create({ email: 'user@example.com', password: hash, username: 'user@example.com' }),
    );
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

  it('returns auth providers', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/providers')
      .expect(200);
    expect(res.body).toEqual([
      { name: 'google', url: '/auth/google', label: 'Google' },
      { name: 'facebook', url: '/auth/facebook', label: 'Facebook' },
    ]);
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

  it('invalidates refresh tokens after password reset', async () => {
    const auth = app.get(AuthService);
    const redis = app.get<MockRedis>('REDIS_CLIENT');
    const tokens = await auth.login('user@example.com', 'secret');
    expect(tokens).toBeTruthy();
    await auth.requestPasswordReset('user@example.com');
    const code = await redis.get('reset:user@example.com');
    expect(code).toBeTruthy();
    const ok = await auth.resetPassword('user@example.com', code!, 'new-secret');
    expect(ok).toBe(true);
    const rotated = await auth.refresh(tokens.refreshToken);
    expect(rotated).toBeNull();
  });
});
