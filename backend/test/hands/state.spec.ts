import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { HandsController } from '../../src/routes/hands.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import { HandLog } from '../../src/game/hand-log';

const repo = {
  findOne: ({ where: { id } }: any) => Promise.resolve({ id } as Hand),
};

describe('HandsController state', () => {
  let app: INestApplication;
  const postState = {
    street: 'preflop',
    pot: 10,
    sidePots: [] as any[],
    currentBet: 10,
    players: [
      { id: 'p1', stack: 90, folded: false, bet: 10, allIn: false },
    ],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandsController],
      providers: [{ provide: getRepositoryToken(Hand), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const log = new HandLog('hand1');
    const pre = {
      street: 'preflop',
      pot: 0,
      sidePots: [] as any[],
      currentBet: 0,
      players: [
        { id: 'p1', stack: 100, folded: false, bet: 0, allIn: false },
      ],
    };
    log.record({ type: 'postBlind', playerId: 'p1', amount: 10 }, pre, postState);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns reconstructed state', () => {
    return request(app.getHttpServer())
      .get('/hands/hand1/state/0')
      .expect(200)
      .expect(postState);
  });
});

