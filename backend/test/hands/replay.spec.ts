import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  bootstrapHandController,
  auth,
  writeHandLog,
  removeHandLog,
} from './hand-test-utils';

describe('HandController replay', () => {
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
    writeHandLog('handR', [0, { type: 'start' }, pre, post]);
  });

  afterAll(async () => {
    await app.close();
    removeHandLog('handR');
  });

  const expected = [
    {
      street: 'preflop',
      pot: 10,
      sidePots: [] as any[],
      currentBet: 10,
      players: [
        { id: 'u1', stack: 90, folded: false, bet: 10, allIn: false },
      ],
      communityCards: [],
    },
  ];

  it('returns replay frames for participant', () => {
    return request(app.getHttpServer())
      .get('/hands/handR/replay')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(expected);
  });

  it('returns 403 for non-participant', () => {
    return request(app.getHttpServer())
      .get('/hands/handR/replay')
      .set('Authorization', auth('u2'))
      .expect(403);
  });
});
