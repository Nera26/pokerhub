import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import type { HandProof } from '../../src/game/rng';

describe('HandController proof', () => {
  let app: INestApplication;
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandController],
      providers: [{ provide: getRepositoryToken(Hand), useValue: repo }],
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
    writeFileSync(file, `${JSON.stringify({ proof })}\n`);
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
      .expect(200)
      .expect(proof);

    if (existsSync(file)) unlinkSync(file);
  });

  it('falls back to hand entity when log missing', () => {
    const proof: HandProof = { seed: 's', nonce: 'n', commitment: 'c' };
    store.set('hand2', {
      id: 'hand2',
      log: '',
      commitment: proof.commitment,
      seed: proof.seed,
      nonce: proof.nonce,
      settled: true,
    } as unknown as Hand);

    return request(app.getHttpServer())
      .get('/hands/hand2/proof')
      .expect(200)
      .expect(proof);
  });
});
