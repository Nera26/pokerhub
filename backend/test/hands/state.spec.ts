import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  bootstrapHandController,
  auth,
  writeHandLog,
  removeHandLog,
} from './hand-test-utils';

describe('HandController state', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await bootstrapHandController());

    const pre = {
      phase: 'BETTING_ROUND',
      street: 'preflop',
      pot: 0,
      sidePots: [] as any[],
      currentBet: 0,
      players: [
        { id: 'u1', stack: 100, folded: false, bet: 0, allIn: false },
      ],
      deck: [],
      communityCards: [],
    };
    const post = {
      phase: 'BETTING_ROUND',
      street: 'preflop',
      pot: 10,
      sidePots: [] as any[],
      currentBet: 10,
      players: [
        { id: 'u1', stack: 90, folded: false, bet: 10, allIn: false },
      ],
      deck: [],
      communityCards: [],
    };
    writeHandLog('handS', [0, { type: 'start' }, pre, post]);
  });

  afterAll(async () => {
    await app.close();
    removeHandLog('handS');
  });

  const expected = {
    version: '1',
    tick: 1,
    phase: 'BETTING_ROUND',
    street: 'preflop',
    pot: 10,
    sidePots: [] as any[],
    currentBet: 10,
    players: [
      { id: 'u1', stack: 90, folded: false, bet: 10, allIn: false },
    ],
    communityCards: [],
  };

  it('returns state for participant', () => {
    return request(app.getHttpServer())
      .get('/hands/handS/state/0')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(expected);
  });

  it('allows admin to access state', () => {
    return request(app.getHttpServer())
      .get('/hands/handS/state/0')
      .set('Authorization', auth('admin', 'admin'))
      .expect(200)
      .expect(expected);
  });

  it('returns 403 for non-participant', () => {
    return request(app.getHttpServer())
      .get('/hands/handS/state/0')
      .set('Authorization', auth('u2'))
      .expect(403);
  });
});

