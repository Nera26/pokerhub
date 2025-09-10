import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrecacheController } from '../src/routes/precache.controller';

describe('PrecacheController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PrecacheController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns asset urls', async () => {
    await request(app.getHttpServer())
      .get('/precache')
      .expect(200)
      .expect(['/', '/offline', '/favicon.ico']);
  });
});
