import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  bootstrapHandController,
  auth,
  removeHandLog,
} from './hand-test-utils';
import { buildHandLog, post } from './fixtures';

describe('HandController replay', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await bootstrapHandController());

    buildHandLog('handR');
  });

  afterAll(async () => {
    await app.close();
    removeHandLog('handR');
  });

  const expected = [
    {
      street: post.street,
      pot: post.pot,
      sidePots: post.sidePots,
      currentBet: post.currentBet,
      players: post.players,
      communityCards: post.communityCards,
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
