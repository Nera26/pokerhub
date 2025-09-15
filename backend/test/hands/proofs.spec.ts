import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import type { HandProofResponse } from '@shared/types';
import { createProofFile, cleanupProofFile } from './proofTestUtils';

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
    const p1: HandProofResponse = { seed: 's1', nonce: 'n1', commitment: 'c1' };
    const p2: HandProofResponse = { seed: 's2', nonce: 'n2', commitment: 'c2' };
    createProofFile('h1', p1, new Date(1000));
    createProofFile('h2', p2, new Date(2000));

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

    cleanupProofFile('h1');
    cleanupProofFile('h2');
  });
});
