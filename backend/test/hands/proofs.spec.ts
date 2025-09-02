import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  existsSync,
  unlinkSync,
  writeFileSync,
  utimesSync,
  mkdirSync,
} from 'fs';
import { join } from 'path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import type { HandProof } from '../../src/game/rng';
import { ConfigService } from '@nestjs/config';

describe('HandController proofs', () => {
  let app: INestApplication;
  const repo = {};
  const config = new ConfigService({ auth: { jwtSecrets: ['secret'] } });

  function adminAuth() {
    const token = jwt.sign({ sub: 'admin', role: 'admin' }, 'secret');
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

  it('filters proofs by ids and time range', async () => {
    const dir = join(process.cwd(), '../storage/proofs');
    mkdirSync(dir, { recursive: true });
    const p1: HandProof = { seed: 's1', nonce: 'n1', commitment: 'c1' };
    const p2: HandProof = { seed: 's2', nonce: 'n2', commitment: 'c2' };
    const f1 = join(dir, 'h1.json');
    const f2 = join(dir, 'h2.json');
    writeFileSync(f1, JSON.stringify(p1));
    writeFileSync(f2, JSON.stringify(p2));
    const early = new Date(1000);
    const late = new Date(2000);
    utimesSync(f1, early, early);
    utimesSync(f2, late, late);

    await request(app.getHttpServer())
      .get('/hands/proofs?from=1500')
      .set('Authorization', adminAuth())
      .expect(200)
      .expect([{ id: 'h2', proof: p2 }]);

    await request(app.getHttpServer())
      .get('/hands/proofs?ids=h1')
      .set('Authorization', adminAuth())
      .expect(200)
      .expect([{ id: 'h1', proof: p1 }]);

    if (existsSync(f1)) unlinkSync(f1);
    if (existsSync(f2)) unlinkSync(f2);
  });
});
