process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NavItemsController } from '../src/routes/nav-items.controller';
import type { NavItem } from '@shared/types';

describe('NavItemsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [NavItemsController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns navigation items with notifications', async () => {
    const res = await request(app.getHttpServer()).get('/nav-items').expect(200);
    const items: NavItem[] = res.body;
    expect(items.find((i) => i.flag === 'notifications')).toBeTruthy();
  });
});
