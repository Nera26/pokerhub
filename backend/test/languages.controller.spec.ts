import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LanguagesController } from '../src/routes/languages.controller';
import type { LanguagesResponse } from '@shared/types';

const mockLanguages: LanguagesResponse = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

describe('LanguagesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LanguagesController],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns supported languages', async () => {
    const res = await request(app.getHttpServer()).get('/languages').expect(200);
    expect(res.body).toEqual(mockLanguages);
  });
});
