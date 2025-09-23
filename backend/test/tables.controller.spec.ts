process.env.DATABASE_URL = '';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test';
process.env.GCS_BUCKET = 'bucket';
process.env.GCS_EMULATOR_HOST = 'http://localhost';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
process.env.JWT_SECRET = 'secret';

jest.mock('../src/game/chat.service');
jest.mock('p-queue', () => ({
  __esModule: true,
  default: class {
    add<T>(fn: () => Promise<T> | T): Promise<T> | T {
      return fn();
    }
    clear() {}
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TablesController } from '../src/routes/tables.controller';
import { TablesService } from '../src/game/tables.service';
import { ChatService } from '../src/game/chat.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('TablesController', () => {
  let app: INestApplication;
  const tables = {
    getTableState: jest.fn(),
    getTablesForUser: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [
        { provide: TablesService, useValue: tables },
        { provide: ChatService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.userId = 'user-1';
          return true;
        },
      })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns table state', async () => {
    tables.getTableState.mockResolvedValue({
      handId: 'h1',
      seats: [],
      pot: { main: 0, sidePots: [] },
      street: 'pre',
      serverTime: 123,
    });

    const res = await request(app.getHttpServer())
      .get('/tables/11111111-1111-1111-1111-111111111111/state')
      .expect(200);
    expect(res.body).toEqual({
      handId: 'h1',
      seats: [],
      pot: { main: 0, sidePots: [] },
      street: 'pre',
      serverTime: 123,
    });
  });

  it('returns tables for the authenticated session', async () => {
    tables.getTablesForUser.mockResolvedValue([
      {
        id: 't1',
        tableName: 'Table 1',
        gameType: 'texas',
        stakes: { small: 1, big: 2 },
        startingStack: 100,
        players: { current: 1, max: 6 },
        buyIn: { min: 50, max: 200 },
        stats: { handsPerHour: 30, avgPot: 40, rake: 5 },
        createdAgo: 'just now',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/tables/sessions')
      .expect(200);

    expect(tables.getTablesForUser).toHaveBeenCalledWith('user-1');
    expect(res.body).toEqual([
      {
        id: 't1',
        tableName: 'Table 1',
        gameType: 'texas',
        stakes: { small: 1, big: 2 },
        startingStack: 100,
        players: { current: 1, max: 6 },
        buyIn: { min: 50, max: 200 },
        stats: { handsPerHour: 30, avgPot: 40, rake: 5 },
        createdAgo: 'just now',
      },
    ]);
  });
});
