import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TiersController } from '../src/routes/tiers.controller';

describe('TiersController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TiersController],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns tier definitions', async () => {
    const res = await request(app.getHttpServer()).get('/tiers').expect(200);
    expect(res.body).toEqual([
      { name: 'Bronze', min: 0, max: 999 },
      { name: 'Silver', min: 1000, max: 4999 },
      { name: 'Gold', min: 5000, max: 9999 },
      { name: 'Diamond', min: 10000, max: 19999 },
      { name: 'Platinum', min: 20000, max: null },
    ]);
  });
});
