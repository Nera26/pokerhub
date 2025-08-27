import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { StatusResponseSchema } from '@shared/types';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';

describe('Contract: GET /status', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches shared schema and OpenAPI spec', async () => {
    const res = await request(app.getHttpServer()).get('/status').expect(200);
    const parsed = StatusResponseSchema.parse(res.body);

    const docPath = resolve(__dirname, '../../../contracts/openapi.yaml');
    const doc = load(readFileSync(docPath, 'utf8')) as any;
    expect(doc.paths['/status'].get.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/StatusResponse',
    });
    expect(doc.components.schemas.StatusResponse).toEqual({
      type: 'object',
      properties: { status: { type: 'string' } },
      required: ['status'],
    });
    expect(parsed).toEqual({ status: 'ok' });
  });
});
