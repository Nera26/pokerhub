import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
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

  it('returns asset urls from manifest', async () => {
    const manifest = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          '..',
          'frontend',
          '.next',
          'precache-manifest.json',
        ),
        'utf-8',
      ),
    );
    await request(app.getHttpServer())
      .get('/precache')
      .expect(200)
      .expect(manifest);
  });
});
