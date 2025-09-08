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

  it('includes tournaments played in promotion list', async () => {
    const res = await request(app.getHttpServer())
      .get('/promotions')
      .expect(200);
    const promo = res.body.find((p: any) => p.id === '2');
    expect(promo.breakdown).toEqual([
      { label: 'Tournaments Played', value: 2 },
    ]);
  });

  it('returns tournaments played for specific promotion', async () => {
    const res = await request(app.getHttpServer())
      .get('/promotions/2')
      .expect(200);
    expect(res.body.breakdown).toEqual([
      { label: 'Tournaments Played', value: 2 },
    ]);
    expect(res.body.unlockText).toBe('Play 5 tournaments');
  });
});
