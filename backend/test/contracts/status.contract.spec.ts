import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ServiceStatusResponseSchema } from '@shared/types';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';

describe('Contract: GET /status', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: 'API_CONTRACT_VERSION', useValue: API_CONTRACT_VERSION },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches shared schema and OpenAPI spec', async () => {
    const res = await request(app.getHttpServer()).get('/status').expect(200);
    const parsed = ServiceStatusResponseSchema.parse(res.body);

    const docPath = resolve(__dirname, '../../../contracts/openapi.yaml');
    const doc = load(readFileSync(docPath, 'utf8')) as any;
    expect(doc.paths['/status'].get.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/ServiceStatusResponse',
    });
    expect(doc.components.schemas.ServiceStatusResponse).toEqual({
      type: 'object',
      properties: {
        status: { type: 'string' },
        contractVersion: { type: 'string' },
      },
      required: ['status', 'contractVersion'],
    });
    expect(parsed).toEqual({ status: 'ok', contractVersion: API_CONTRACT_VERSION });
  });
});
