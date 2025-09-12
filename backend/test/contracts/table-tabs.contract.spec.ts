import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Controller, Get, Param } from '@nestjs/common';
import { TableTabsResponseSchema, type TabKey } from '@shared/types';

class TablesServiceStub {
  async getSidePanelTabs() {
    return ['history', 'chat', 'notes'];
  }
}

@Controller('tables')
class TabsTestController {
  constructor(private readonly tables: TablesServiceStub) {}

  @Get(':id/tabs')
  async list(@Param('id') id: string): Promise<TabKey[]> {
    const res = await this.tables.getSidePanelTabs(id);
    return TableTabsResponseSchema.parse(res);
  }
}

describe('Contract: GET /tables/{id}/tabs', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TabsTestController],
      providers: [TablesServiceStub],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches shared schema and OpenAPI spec', async () => {
    const res = await request(app.getHttpServer())
      .get('/tables/1/tabs')
      .expect(200);
    const parsed = TableTabsResponseSchema.parse(res.body);

    const docPath = resolve(__dirname, '../../../contracts/openapi.yaml');
    const doc = load(readFileSync(docPath, 'utf8')) as any;
    expect(
      doc.paths['/tables/{id}/tabs'].get.responses['200'].content['application/json'].schema,
    ).toEqual({ $ref: '#/components/schemas/TableTabsResponse' });
    expect(doc.components.schemas.TabKey).toEqual({
      type: 'string',
      enum: ['history', 'chat', 'notes'],
    });
    expect(doc.components.schemas.TableTabsResponse).toEqual({
      type: 'array',
      items: { $ref: '#/components/schemas/TabKey' },
    });
    expect(parsed).toEqual(['history', 'chat', 'notes']);
  });
});
