import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import type { HandProofResponse } from '@shared/types';
import { ConfigService } from '@nestjs/config';

const state = {
  phase: 'DEAL',
  street: 'preflop',
  pot: 0,
  sidePots: [],
  currentBet: 0,
  players: [
    {
      id: 'u1',
      stack: 1000,
      folded: false,
      bet: 0,
      allIn: false,
      holeCards: [1, 2],
    },
    {
      id: 'u2',
      stack: 1000,
      folded: false,
      bet: 0,
      allIn: false,
      holeCards: [3, 4],
    },
  ],
  deck: [],
  communityCards: [],
} as any;

function expectedState(viewerId: string) {
  const players = state.players.map((p) => {
    if (p.id === viewerId) return p;
    const { holeCards, ...rest } = p;
    return rest;
  });
  return {
    version: '1',
    tick: 1,
    phase: state.phase,
    street: state.street,
    pot: state.pot,
    sidePots: state.sidePots,
    currentBet: state.currentBet,
    players,
    communityCards: state.communityCards,
  };
}

describe('HandController', () => {
  let app: INestApplication;
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
  };
  const config = new ConfigService({ auth: { jwtSecrets: ['secret'] } });

  function auth(userId: string, role?: string) {
    const payload: any = { sub: userId };
    if (role) payload.role = role;
    const token = jwt.sign(payload, 'secret');
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns proof from log file', async () => {
    const proof: HandProofResponse = { seed: 'fs', nonce: 'fn', commitment: 'fc' };
    const file = join(process.cwd(), '../storage/hand-logs', 'hand-spec.jsonl');
    const logEntry = [0, { type: 'start' }, { players: [{ id: 'u1' }] }, {}];
    writeFileSync(file, `${JSON.stringify(logEntry)}\n${JSON.stringify({ proof })}\n`);

    await request(app.getHttpServer())
      .get('/hands/hand-spec/proof')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(proof);

    if (existsSync(file)) unlinkSync(file);
  });

  it('returns 404 when proof is missing', async () => {
    const file = join(process.cwd(), '../storage/hand-logs', 'hand-missing.jsonl');
    const logEntry = [0, { type: 'start' }, { players: [{ id: 'u1' }] }, {}];
    writeFileSync(file, `${JSON.stringify(logEntry)}\n`);

    await request(app.getHttpServer())
      .get('/hands/hand-missing/proof')
      .set('Authorization', auth('u1'))
      .expect(404);

    if (existsSync(file)) unlinkSync(file);
  });

  it('reconstructs state at index', async () => {
    const file = join(process.cwd(), '../storage/hand-logs', 'hand-state.jsonl');
    const entry = [0, { type: 'start' }, state, state];
    writeFileSync(file, `${JSON.stringify(entry)}\n`);

    await request(app.getHttpServer())
      .get('/hands/hand-state/state/0')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(expectedState('u1'));

    if (existsSync(file)) unlinkSync(file);
  });

  it('returns 404 for missing state', async () => {
    const file = join(
      process.cwd(),
      '../storage/hand-logs',
      'hand-state-missing.jsonl',
    );
    const entry = [0, { type: 'start' }, state, state];
    writeFileSync(file, `${JSON.stringify(entry)}\n`);

    await request(app.getHttpServer())
      .get('/hands/hand-state-missing/state/5')
      .set('Authorization', auth('u1'))
      .expect(404);

    if (existsSync(file)) unlinkSync(file);
  });

  it('replays hand from db when file missing', async () => {
    const entry = [0, { type: 'start' }, state, state];
    store.set('hand-db-only', { id: 'hand-db-only', log: `${JSON.stringify(entry)}\n` } as Hand);

    const frame = {
      street: state.street,
      pot: state.pot,
      sidePots: state.sidePots,
      currentBet: state.currentBet,
      players: state.players.map((p) => ({
        id: p.id,
        stack: p.stack,
        folded: p.folded,
        bet: p.bet,
        allIn: p.allIn,
      })),
      communityCards: state.communityCards,
    };

    await request(app.getHttpServer())
      .get('/hands/hand-db-only/replay')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect([frame]);

    store.delete('hand-db-only');
  });

  it('returns 404 when log missing', async () => {
    await request(app.getHttpServer())
      .get('/hands/hand-missing-log/replay')
      .set('Authorization', auth('admin', 'admin'))
      .expect(404);
  });
});

