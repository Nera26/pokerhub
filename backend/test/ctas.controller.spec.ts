import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CtasController } from '../src/routes/ctas.controller';

describe('CtasController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CtasController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns CTA list', async () => {
    const res = await request(app.getHttpServer()).get('/ctas').expect(200);
    expect(res.body).toEqual([
      {
        id: 'join-table',
        label: 'Join a Live Table',
        href: '#cash-games-panel',
        variant: 'primary',
      },
      {
        id: 'view-tournaments',
        label: 'View Tournaments',
        href: '#tournaments-panel',
        variant: 'outline',
      },
    ]);
  });
});
