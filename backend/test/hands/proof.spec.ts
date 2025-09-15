import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import type { HandProofResponse } from '@shared/types';
import {
  createHand,
  cleanupHand,
  expectProof,
  expectProofStatus,
} from './proofTestUtils';

describe('HandController proof', () => {
  let app: INestApplication;
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
  };
  const config = new ConfigService({ auth: { jwtSecrets: ['secret'] } });

  function auth(userId: string, role?: string) {
    const token = jwt.sign(
      { sub: userId, ...(role ? { role } : {}) },
      'secret',
    );
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

  it('prefers proof from log file', async () => {
    const proof: HandProofResponse = {
      seed: 'fs',
      nonce: 'fn',
      commitment: 'fc',
      deck: [1, 2, 3],
    };
    createHand({
      handId: 'hand1',
      playerId: 'u1',
      logProof: proof,
      entityProof: { seed: 'dbs', nonce: 'dbn', commitment: 'db' },
      store,
    });

    await expectProof(app, 'hand1', auth('u1'), proof);
    cleanupHand('hand1', store);
  });

  it('falls back to hand entity when log missing', async () => {
    const proof: HandProofResponse = { seed: 's', nonce: 'n', commitment: 'c' };
    createHand({
      handId: 'hand2',
      playerId: 'u1',
      entityProof: proof,
      store,
      writeLog: false,
    });

    await expectProof(app, 'hand2', auth('u1'), proof);
    cleanupHand('hand2', store);
  });

  it('returns 403 for non-participant', async () => {
    const proof: HandProofResponse = { seed: 's3', nonce: 'n3', commitment: 'c3' };
    createHand({ handId: 'hand3', playerId: 'u1', logProof: proof, store });

    await expectProofStatus(app, 'hand3', auth('u2'), 403);
    cleanupHand('hand3', store);
  });

  it('allows admin to access proof', async () => {
    const proof: HandProofResponse = { seed: 's4', nonce: 'n4', commitment: 'c4' };
    createHand({ handId: 'hand4', playerId: 'u1', logProof: proof, store });

    await expectProof(app, 'hand4', auth('admin', 'admin'), proof);
    cleanupHand('hand4', store);
  });
});

