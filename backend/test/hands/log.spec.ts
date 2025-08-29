import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

describe('HandController log', () => {
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

    store.set('hand1', {
      id: 'hand1',
      log: `${JSON.stringify([0, { type: 'start' }, { players: [{ id: 'u1' }] }, {}])}\n` + 'db log',
      commitment: 'c',
      seed: 's',
      nonce: 'n',
      settled: true,
    } as unknown as Hand);
  });

  afterAll(async () => {
    await app.close();
  });

  it('falls back to database log when file missing', () => {
    const file = join(process.cwd(), '../storage/hand-logs', 'hand1.jsonl');
    if (existsSync(file)) unlinkSync(file);
    return request(app.getHttpServer())
      .get('/hands/hand1/log')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(store.get('hand1')!.log);
  });

  it('prefers file log when present', async () => {
    const file = join(process.cwd(), '../storage/hand-logs', 'hand1.jsonl');
    const logEntry = [0, { type: 'start' }, { players: [{ id: 'u1' }] }, {}];
    writeFileSync(file, `${JSON.stringify(logEntry)}\nfile log`);
    await request(app.getHttpServer())
      .get('/hands/hand1/log')
      .set('Authorization', auth('u1'))
      .expect(200)
      .expect(`${JSON.stringify(logEntry)}\nfile log`);
    if (existsSync(file)) unlinkSync(file);
  });
});
