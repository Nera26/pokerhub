import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { HandController } from './hand.controller';
import { Hand } from '../database/entities/hand.entity';
import type { HandProof } from '@shared/types';
import { ConfigService } from '@nestjs/config';

describe('HandController', () => {
  let app: INestApplication;
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
  };
  const config = new ConfigService({ auth: { jwtSecrets: ['secret'] } });

  function auth(userId: string) {
    const token = jwt.sign({ sub: userId }, 'secret');
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
    const proof: HandProof = { seed: 'fs', nonce: 'fn', commitment: 'fc' };
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
    const file = join(process.cwd(), '../storage/hand-logs', 'hand-state.jsonl');
    const entry = [0, { type: 'start' }, state, state];
    writeFileSync(file, `${JSON.stringify(entry)}\n`);

    await request(app.getHttpServer())
      .get('/hands/hand-state/state/0')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect({
        version: '1',
        tick: 1,
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
          },
        ],
        communityCards: [],
      });

    if (existsSync(file)) unlinkSync(file);
  });

  it('returns 404 for missing state', async () => {
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
        },
      ],
      deck: [],
      communityCards: [],
    } as any;
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
});

