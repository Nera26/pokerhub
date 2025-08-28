import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TablesController } from '../../src/routes/tables.controller';
import { TablesService } from '../../src/game/tables.service';
import { TableListSchema } from '@shared/types';

describe('TablesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [TablesService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns lobby tables', async () => {
    const res = await request(app.getHttpServer()).get('/tables').expect(200);
    const parsed = TableListSchema.parse(res.body);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('1');
  });
});
