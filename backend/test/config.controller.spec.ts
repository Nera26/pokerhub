import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigController } from '../src/routes/config.controller';
import type { ChipDenominationsResponse } from '@shared/types';

const mockResponse: ChipDenominationsResponse = { denoms: [1000, 100, 25] };

describe('ConfigController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ConfigController],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns chip denominations', async () => {
    const res = await request(app.getHttpServer())
      .get('/config/chips')
      .expect(200);
    expect(res.body).toEqual(mockResponse);
  });
});
