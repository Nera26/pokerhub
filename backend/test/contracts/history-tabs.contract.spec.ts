import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { HistoryTabsResponseSchema } from '@shared/types';
import { HistoryTabsController } from '../../src/routes/history-tabs.controller';
import { HistoryTabsService } from '../../src/services/history-tabs.service';

describe('Contract: GET /history-tabs', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HistoryTabsController],
      providers: [HistoryTabsService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches shared schema and OpenAPI spec', async () => {
    const res = await request(app.getHttpServer())
      .get('/history-tabs')
      .expect(200);
    const parsed = HistoryTabsResponseSchema.parse(res.body);

    const docPath = resolve(__dirname, '../../../contracts/openapi.yaml');
    const doc = load(readFileSync(docPath, 'utf8')) as any;
    expect(
      doc.paths['/history-tabs'].get.responses['200'].content['application/json'].schema,
    ).toEqual({ $ref: '#/components/schemas/HistoryTabsResponse' });
    expect(doc.components.schemas.HistoryTabItem).toEqual({
      type: 'object',
      required: ['key', 'label'],
      properties: { key: { type: 'string' }, label: { type: 'string' } },
    });
    expect(doc.components.schemas.HistoryTabsResponse).toEqual({
      type: 'object',
      required: ['tabs'],
      properties: {
        tabs: {
          type: 'array',
          items: { $ref: '#/components/schemas/HistoryTabItem' },
        },
      },
    });
    expect(parsed.tabs.length).toBeGreaterThan(0);
  });
});
