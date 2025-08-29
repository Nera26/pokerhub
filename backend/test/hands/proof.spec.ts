import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import type { HandProof } from '../../src/game/rng';
import { ConfigService } from '@nestjs/config';

describe('HandController proof', () => {
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

  it('prefers proof from log file', async () => {
    const proof: HandProof = { seed: 'fs', nonce: 'fn', commitment: 'fc' };
    const file = join(process.cwd(), '../storage/hand-logs', 'hand1.jsonl');
    const logEntry = [0, { type: 'start' }, { players: [{ id: 'u1' }] }, {}];
    writeFileSync(file, `${JSON.stringify(logEntry)}\n${JSON.stringify({ proof })}\n`);
    store.set('hand1', {
      id: 'hand1',
      log: '',
      commitment: 'db',
      seed: 'dbs',
      nonce: 'dbn',
      settled: true,
    } as unknown as Hand);

    await request(app.getHttpServer())
      .get('/hands/hand1/proof')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(proof);

    if (existsSync(file)) unlinkSync(file);
  });

  it('falls back to hand entity when log missing', () => {
    const proof: HandProof = { seed: 's', nonce: 'n', commitment: 'c' };
    const logEntry = [0, { type: 'start' }, { players: [{ id: 'u1' }] }, {}];
    store.set('hand2', {
      id: 'hand2',
      log: `${JSON.stringify(logEntry)}\n`,
      commitment: proof.commitment,
      seed: proof.seed,
      nonce: proof.nonce,
      settled: true,
    } as unknown as Hand);

    return request(app.getHttpServer())
      .get('/hands/hand2/proof')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(proof);
  });
});
