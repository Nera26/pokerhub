import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PromotionsController } from '../src/routes/promotions.controller';

describe('PromotionsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PromotionsController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns promotion with breakdown and eta', async () => {
    const res = await request(app.getHttpServer())
      .get('/promotions/1')
      .expect(200);
    expect(res.body.breakdown).toEqual([
      { label: 'Cashed hands', value: 200 },
      { label: 'Showdown wins', value: 150 },
    ]);
    expect(res.body.eta).toBe('~2 hours of average play');
  });
});
