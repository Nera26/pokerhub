import { Test } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SessionService } from '../src/session/session.service';
import { LoginResponseSchema } from '@shared/types';
import { ConfigService } from '@nestjs/config';
import { GeoIpService } from '../src/auth/geoip.service';
import { MockRedis } from './utils/mock-redis';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { WalletService } from '../src/wallet/wallet.service';

class MockConfigService {
  get(key: string, def?: any) {
    const map: Record<string, any> = {
      'auth.jwtSecrets': ['test-secret'],
      'auth.accessTtl': 900,
      'auth.refreshTtl': 3600,
      'rateLimit.window': 60,
      'rateLimit.max': 5,
      'geo.allowedCountries': ['US'],
    };
    return map[key] ?? def;
  }
}

describe('GeoIP restrictions', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        SessionService,
        GeoIpService,
        { provide: 'REDIS_CLIENT', useClass: MockRedis },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: AnalyticsService, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows login from permitted country', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-device-id', 'success')
      .set('X-Forwarded-For', '8.8.8.8')
      .send({ email: 'user@example.com', password: 'secret' })
      .expect(200);
    const parsed = LoginResponseSchema.parse(res.body);
    expect(parsed.token).toBeDefined();
  });

  it('blocks login from disallowed country', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-device-id', 'success')
      .set('X-Forwarded-For', '24.48.0.1')
      .send({ email: 'user@example.com', password: 'secret' })
      .expect(403);
  });

  it('blocks wallet operations from disallowed country', async () => {
    const geo = new GeoIpService(new MockConfigService() as any);
    const wallet = new WalletService(
      null as any,
      null as any,
      null as any,
      null as any,
      { emit: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      geo,
    );
    await expect(
      wallet.deposit('a', 100, 'd', '24.48.0.1', 'USD'),
    ).rejects.toThrow(ForbiddenException);
  });
});
