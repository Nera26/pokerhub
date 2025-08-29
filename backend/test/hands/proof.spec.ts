import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { HandsController } from '../../src/routes/hands.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import { HandLog } from '../../src/game/hand-log';
import type { HandProof } from '../../src/game/rng';

const repo = {
  findOne: () => Promise.resolve({} as Hand),
};

describe('HandsController proof', () => {
  let app: INestApplication;
  const proof: HandProof = { seed: 's', nonce: 'n', commitment: 'c' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandsController],
      providers: [{ provide: getRepositoryToken(Hand), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const log = new HandLog('hand1');
    const s0 = { street: 'preflop', pot: 0, sidePots: [], currentBet: 0, players: [] } as any;
    log.record({ type: 'check', playerId: 'p1' }, s0, s0);
    log.recordProof(proof);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns proof from hand log', () => {
    return request(app.getHttpServer())
      .get('/hands/hand1/proof')
      .expect(200)
      .expect(proof);
  });
});
