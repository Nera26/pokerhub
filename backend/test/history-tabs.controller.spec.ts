import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { HistoryTabsResponse } from '@shared/types';
import { HistoryTabsController } from '../src/routes/history-tabs.controller';
import { HistoryTabsService } from '../src/services/history-tabs.service';

describe('HistoryTabsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HistoryTabsController],
      providers: [HistoryTabsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns history tabs', async () => {
    const res = await request(app.getHttpServer())
      .get('/history-tabs')
      .expect(200);
    const body: HistoryTabsResponse = res.body;
    expect(body).toEqual({
      tabs: [
        { key: 'game-history', label: 'Game History' },
        { key: 'tournament-history', label: 'Tournament History' },
        { key: 'transaction-history', label: 'Deposit/Withdraw' },
      ],
    });
  });
});
