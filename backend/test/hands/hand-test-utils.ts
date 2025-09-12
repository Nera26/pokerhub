import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { HandController } from '../../src/game/hand.controller';
import { Hand } from '../../src/database/entities/hand.entity';

export async function bootstrapHandController() {
  const store = new Map<string, Hand>();
  const repo = {
    findOne: ({ where: { id } }: any) => Promise.resolve(store.get(id) ?? null),
  };
  const config = new ConfigService({ auth: { jwtSecrets: ['secret'] } });
  const moduleRef = await Test.createTestingModule({
    controllers: [HandController],
    providers: [
      { provide: getRepositoryToken(Hand), useValue: repo },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, store };
}

export function auth(userId: string, role?: string) {
  const token = jwt.sign({ sub: userId, ...(role ? { role } : {}) }, 'secret');
  return `Bearer ${token}`;
}

const LOG_DIR = join(__dirname, '../../../storage/hand-logs');

export function writeHandLog(handId: string, frames: unknown[]) {
  mkdirSync(LOG_DIR, { recursive: true });
  writeFileSync(join(LOG_DIR, `${handId}.jsonl`), `${JSON.stringify(frames)}\n`);
}

export function removeHandLog(handId: string) {
  const file = join(LOG_DIR, `${handId}.jsonl`);
  if (existsSync(file)) unlinkSync(file);
}
