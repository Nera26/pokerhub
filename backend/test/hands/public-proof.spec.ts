import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Hand } from '../../src/database/entities/hand.entity';
import { HandsController } from '../../src/routes/hands.controller';
import { HandLog } from '../../src/game/hand-log';
import { HandRNG } from '../../src/game/rng';
import { verifyProof } from '@shared/verify';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const repo = {
  findOne: ({ where: { id } }: any) => Promise.resolve({ id } as Hand),
};

describe('HandsController proof', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandsController],
      providers: [{ provide: getRepositoryToken(Hand), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns proof matching verifyProof', async () => {
    const rng = new HandRNG();
    const proof = rng.reveal();
    const log = new HandLog('hand1', rng.commitment);
    log.recordProof(proof);
    await log.flush();

    const res = await request(app.getHttpServer())
      .get('/hands/hand1/proof')
      .expect(200);

    expect(res.body).toEqual(proof);
    expect(verifyProof(res.body)).toBe(true);

    const file = join(process.cwd(), '../storage/hand-logs', 'hand1.jsonl');
    if (existsSync(file)) unlinkSync(file);
  });

  it('returns 404 when proof missing', async () => {
    const log = new HandLog('hand2', 'c');
    await log.flush();

    await request(app.getHttpServer())
      .get('/hands/hand2/proof')
      .expect(404);

    const file = join(process.cwd(), '../storage/hand-logs', 'hand2.jsonl');
    if (existsSync(file)) unlinkSync(file);
  });
});
