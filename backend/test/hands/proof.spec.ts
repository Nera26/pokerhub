import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import type { HandProof } from '../../src/game/rng';

describe('HandController proof', () => {
  let app: INestApplication;
  const proof: HandProof = { seed: 's', nonce: 'n', commitment: 'c' };
  const repo = {
    findOne: () =>
      Promise.resolve({ ...proof, log: '', settled: false } as unknown as Hand),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandController],
      providers: [{ provide: getRepositoryToken(Hand), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns proof from hand entity', () => {
    return request(app.getHttpServer())
      .get('/hands/hand1/proof')
      .expect(200)
      .expect(proof);
  });
});
