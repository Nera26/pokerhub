import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { HandsController } from '../../src/routes/hands.controller';
import { Hand } from '../../src/database/entities/hand.entity';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('HandsController log', () => {
  let app: INestApplication;
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
    save: (h: Hand) => {
      store.set(h.id, h);
      return Promise.resolve(h);
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HandsController],
      providers: [{ provide: getRepositoryToken(Hand), useValue: repo }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await repo.save({
      id: 'hand1',
      log: 'db log',
      commitment: 'c',
      seed: 's',
      nonce: 'n',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('falls back to database log when file missing', () => {
    const file = join(process.cwd(), '../storage/hand-logs', 'hand1.jsonl');
    if (existsSync(file)) unlinkSync(file);
    return request(app.getHttpServer())
      .get('/hands/hand1/log')
      .expect(200)
      .expect('db log');
  });

  it('prefers file log when present', async () => {
    const file = join(process.cwd(), '../storage/hand-logs', 'hand1.jsonl');
    writeFileSync(file, 'file log');
    await request(app.getHttpServer())
      .get('/hands/hand1/log')
      .expect(200)
      .expect('file log');
    if (existsSync(file)) unlinkSync(file);
  });
});
