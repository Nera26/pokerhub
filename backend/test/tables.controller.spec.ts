process.env.DATABASE_URL = '';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test';
process.env.GCS_BUCKET = 'bucket';
process.env.GCS_EMULATOR_HOST = 'http://localhost';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
process.env.JWT_SECRET = 'secret';

jest.mock('../src/game/chat.service');

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TablesController } from '../src/routes/tables.controller';
import { TablesService } from '../src/game/tables.service';
import { ChatService } from '../src/game/chat.service';

describe('TablesController', () => {
  let app: INestApplication;
  const tables = { getTableState: jest.fn() };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [
        { provide: TablesService, useValue: tables },
        { provide: ChatService, useValue: {} },
      ],
    }).compile();

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
    });

    const res = await request(app.getHttpServer())
      .get('/tables/123/state')
      .expect(200);
    expect(res.body).toEqual({
      handId: 'h1',
      seats: [],
      pot: { main: 0, sidePots: [] },
      street: 'pre',
    });
  });
});
