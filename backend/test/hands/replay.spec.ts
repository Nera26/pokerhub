import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import { ConfigService } from '@nestjs/config';

describe('HandController replay', () => {
  let app: INestApplication;
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
  };
  const config = new ConfigService({ auth: { jwtSecrets: ['secret'] } });

  function auth(userId: string, role?: string) {
    const token = jwt.sign({ sub: userId, ...(role ? { role } : {}) }, 'secret');
    return `Bearer ${token}`;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandController],
      providers: [
        { provide: getRepositoryToken(Hand), useValue: repo },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

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
    const dir = join(__dirname, '../../../storage/hand-logs');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'handR.jsonl'),
      `${JSON.stringify([0, { type: 'start' }, pre, post])}\n`,
    );
  });

  afterAll(async () => {
    await app.close();
    const file = join(__dirname, '../../../storage/hand-logs', 'handR.jsonl');
    if (existsSync(file)) unlinkSync(file);
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
