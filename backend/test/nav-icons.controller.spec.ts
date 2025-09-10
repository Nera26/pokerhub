process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NavIconsController } from '../src/routes/nav-icons.controller';
import { NavIconsService } from '../src/services/nav-icons.service';
import type { NavIconsResponse } from '@shared/types';

describe('NavIconsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [NavIconsController],
      providers: [NavIconsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns navigation icons', async () => {
    const res = await request(app.getHttpServer()).get('/nav-icons').expect(200);
    const body: NavIconsResponse = res.body;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'home', svg: expect.any(String) }),
      ]),
    );
  });
});
