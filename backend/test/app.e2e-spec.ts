process.env.DATABASE_URL = 'postgres://localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test-project';
process.env.GCS_BUCKET = 'bucket';
process.env.GCS_EMULATOR_HOST = 'http://localhost';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
process.env.JWT_SECRET = 'secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
jest.mock('../src/messaging/messaging.module', () => ({
  MessagingModule: class MessagingModule {},
}));
jest.mock('../src/redis/redis.module', () => ({
  RedisModule: class RedisModule {},
}));
jest.mock('../src/session/session.module', () => ({
  SessionModule: class SessionModule {},
}));
jest.mock('../src/leaderboard/leaderboard.module', () => ({
  LeaderboardModule: class LeaderboardModule {},
}));
jest.mock('../src/game/game.module', () => ({
  GameModule: class GameModule {},
}));
jest.mock('../src/storage/storage.module', () => ({
  StorageModule: class StorageModule {},
}));
jest.mock('../src/logging/logging.module', () => ({
  LoggingModule: class LoggingModule {},
}));
jest.mock('../src/analytics/analytics.module', () => ({
  AnalyticsModule: class AnalyticsModule {},
}));
jest.mock('../src/tournament/tournament.module', () => ({
  TournamentModule: class TournamentModule {},
}));
jest.mock('../src/wallet/wallet.module', () => ({
  WalletModule: class WalletModule {},
}));
jest.mock('../src/withdrawals/withdrawals.module', () => ({
  WithdrawalsModule: class WithdrawalsModule {},
}));
jest.mock('../src/users/users.module', () => ({
  UsersModule: class UsersModule {},
}));
jest.mock('../src/notifications/notifications.module', () => ({
  NotificationsModule: class NotificationsModule {},
}));
jest.mock('../src/auth/auth.module', () => ({
  AuthModule: class AuthModule {},
}));
jest.mock('../src/auth/auth.guard', () => ({
  AuthGuard: class AuthGuard {},
}));
jest.mock('../src/feature-flags/feature-flags.module', () => ({
  FeatureFlagsModule: class FeatureFlagsModule {},
}));
jest.mock('../src/metrics/metrics.module', () => ({
  MetricsModule: class MetricsModule {},
}));
jest.mock('../src/broadcasts/broadcasts.module', () => ({
  BroadcastsModule: class BroadcastsModule {},
}));
jest.mock('../src/tiers/tiers.module', () => ({
  TiersModule: class TiersModule {},
}));
jest.mock('../src/ctas/ctas.module', () => ({
  CtasModule: class CtasModule {},
}));
jest.mock('../src/history/history.module', () => ({
  HistoryModule: class HistoryModule {},
}));
import { AppModule } from './../src/app.module';
import testDataSource from './utils/test-datasource';
import { UserRepository } from './../src/users/user.repository';
import { API_CONTRACT_VERSION } from '@shared/constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    if (!testDataSource.isInitialized) {
      await testDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(testDataSource)
      .overrideProvider(UserRepository)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/status (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/status').expect(200);
    expect(res.body).toEqual({
      status: 'ok',
      contractVersion: API_CONTRACT_VERSION,
    });
  });

  it('applies security headers', async () => {
    const res = await request(app.getHttpServer()).get('/status');
    expect(res.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
    expect(res.headers['strict-transport-security']).toContain(
      'max-age=31536000',
    );
  });
});
