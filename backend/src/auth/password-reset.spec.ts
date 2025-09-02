import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from '../session/session.service';
import { ConfigService } from '@nestjs/config';
import { MockRedis } from '../../test/utils/mock-redis';
import { AnalyticsService } from '../analytics/analytics.service';
import { GeoIpService } from './geoip.service';
import { AuthRateLimitMiddleware } from './rate-limit.middleware';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../users/user.repository';
import { EmailService } from './email.service';
import { MetricsWriterService } from '../metrics/metrics-writer.service';

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

class MockConfigService {
  get(key: string, def?: any) {
    const map: Record<string, any> = {
      'auth.jwtSecrets': ['test-secret'],
      'auth.accessTtl': 900,
      'auth.refreshTtl': 3600,
      'rateLimit.window': 60,
      'rateLimit.max': 5,
      'geo.allowedCountries': [],
      'auth.resetTtl': 300,
    };
    return map[key] ?? def;
  }
}

class MockEmailService {
  last?: { email: string; code: string };
  async sendResetCode(email: string, code: string) {
    this.last = { email, code };
  }
}

describe('Password reset flow', () => {
  let app: INestApplication;
  let email: MockEmailService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        SessionService,
        GeoIpService,
        AuthRateLimitMiddleware,
        { provide: 'REDIS_CLIENT', useClass: MockRedis },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: AnalyticsService, useValue: { emit: jest.fn() } },
        { provide: UserRepository, useClass: InMemoryUserRepository },
        { provide: EmailService, useClass: MockEmailService },
        MetricsWriterService,
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
    email = app.get<MockEmailService>(EmailService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('resets password with valid code', async () => {
    await request(app.getHttpServer())
      .post('/auth/request-reset')
      .send({ email: 'user@example.com' })
      .expect(200);
    const code = email.last?.code as string;
    await request(app.getHttpServer())
      .post('/auth/verify-reset-code')
      .send({ email: 'user@example.com', code })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: 'user@example.com', code, password: 'newpass' })
      .expect(200);
    // login with new password succeeds
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-device-id', 'device')
      .send({ email: 'user@example.com', password: 'newpass' })
      .expect(200);
  });

  it('rejects invalid code', async () => {
    await request(app.getHttpServer())
      .post('/auth/request-reset')
      .send({ email: 'user@example.com' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/verify-reset-code')
      .send({ email: 'user@example.com', code: 'wrong' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: 'user@example.com', code: 'wrong', password: 'foo' })
      .expect(401);
  });
});

