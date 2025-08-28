import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';

describe('HandController', () => {
  let app: INestApplication;
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
    save: (h: Hand) => {
      store.set(h.id, h);
      return Promise.resolve(h);
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandController],
      providers: [{ provide: getRepositoryToken(Hand), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await repo.save({
      id: 'hand1',
      log: '[]',
      commitment: 'c',
      seed: 's',
      nonce: 'n',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns proof', () => {
    return request(app.getHttpServer())
      .get('/hands/hand1/proof')
      .expect(200)
      .expect({ seed: 's', nonce: 'n', commitment: 'c' });
  });
});
