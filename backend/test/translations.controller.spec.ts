process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TranslationsController } from '../src/routes/translations.controller';
import { TranslationsService } from '../src/services/translations.service';

describe('TranslationsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TranslationsController],
      providers: [TranslationsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns translations for supported language', async () => {
    const res = await request(app.getHttpServer())
      .get('/translations/es')
      .expect(200);
    expect(res.body.messages['login.title']).toBe('Iniciar sesión');
  });

  it('falls back to English for unsupported language', async () => {
    const res = await request(app.getHttpServer())
      .get('/translations/fr')
      .expect(200);
    expect(res.body.messages['login.title']).toBe('Login');
  });

  it('handles service errors', async () => {
    const svc = app.get(TranslationsService);
    jest.spyOn(svc, 'get').mockRejectedValueOnce(new Error('boom'));
    await request(app.getHttpServer())
      .get('/translations/en')
      .expect(500);
  });
});
