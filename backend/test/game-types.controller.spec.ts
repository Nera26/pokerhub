import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GameTypesController } from '../src/routes/game-types.controller';

describe('GameTypesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GameTypesController],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns game types', async () => {
    const res = await request(app.getHttpServer()).get('/game-types').expect(200);
    expect(res.body).toEqual(['texas', 'omaha', 'allin', 'tournaments']);
  });
});
