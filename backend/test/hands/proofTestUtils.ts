import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
  utimesSync,
} from 'fs';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import type { HandProofResponse } from '@shared/types';
import { Hand } from '../../src/database/entities/hand.entity';

const LOG_DIR = join(__dirname, '../../../storage/hand-logs');
const PROOF_DIR = join(process.cwd(), '../storage/proofs');

export function createHand({
  handId,
  playerId,
  logProof,
  entityProof,
  store,
  writeLog = true,
}: {
  handId: string;
  playerId: string;
  logProof?: HandProofResponse;
  entityProof?: HandProofResponse;
  store?: Map<string, Hand>;
  writeLog?: boolean;
}) {
  const logEntry = [0, { type: 'start' }, { players: [{ id: playerId }] }, {}];
  if (writeLog) {
    mkdirSync(LOG_DIR, { recursive: true });
    const file = join(LOG_DIR, `${handId}.jsonl`);
    let content = `${JSON.stringify(logEntry)}\n`;
    if (logProof) content += `${JSON.stringify({ proof: logProof })}\n`;
    writeFileSync(file, content);
  }
  if (store && entityProof) {
    store.set(
      handId,
      {
        id: handId,
        log: `${JSON.stringify(logEntry)}\n`,
        commitment: entityProof.commitment,
        seed: entityProof.seed,
        nonce: entityProof.nonce,
        settled: true,
      } as unknown as Hand,
    );
  }
}

export function cleanupHand(handId: string, store?: Map<string, Hand>) {
  const file = join(LOG_DIR, `${handId}.jsonl`);
  if (existsSync(file)) unlinkSync(file);
  if (store) store.delete(handId);
}

export async function expectProof(
  app: INestApplication,
  handId: string,
  auth: string,
  expected: HandProofResponse,
) {
  await request(app.getHttpServer())
    .get(`/hands/${handId}/proof`)
    .set('Authorization', auth)
    .expect(200)
    .expect(expected);
}

export async function expectProofStatus(
  app: INestApplication,
  handId: string,
  auth: string,
  status: number,
) {
  await request(app.getHttpServer())
    .get(`/hands/${handId}/proof`)
    .set('Authorization', auth)
    .expect(status);
}

export function createProofFile(
  handId: string,
  proof: HandProofResponse,
  mtime?: Date,
) {
  mkdirSync(PROOF_DIR, { recursive: true });
  const file = join(PROOF_DIR, `${handId}.json`);
  writeFileSync(file, JSON.stringify(proof));
  if (mtime) utimesSync(file, mtime, mtime);
  return file;
}

export function cleanupProofFile(handId: string) {
  const file = join(PROOF_DIR, `${handId}.json`);
  if (existsSync(file)) unlinkSync(file);
}

