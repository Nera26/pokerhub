import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  bootstrapHandController,
  auth,
  removeHandLog,
} from './hand-test-utils';
import { buildHandLog, post } from './fixtures';

describe('HandController state', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await bootstrapHandController());

    buildHandLog('handS');
  });

  afterAll(async () => {
    await app.close();
    removeHandLog('handS');
  });

  const expected = {
    version: '1',
    tick: 1,
    phase: post.phase,
    street: post.street,
    pot: post.pot,
    sidePots: post.sidePots,
    currentBet: post.currentBet,
    players: post.players,
    communityCards: post.communityCards,
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

