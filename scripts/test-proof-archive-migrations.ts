#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { AppDataSource } from '../backend/src/database/data-source';
import { Hand } from '../backend/src/database/entities/hand.entity';
import { bytesToHex, hashCommitment, revealDeck, verifyProof } from '../shared/verify';
import * as fs from 'fs/promises';
import * as path from 'path';

async function waitForPostgres(container: string) {
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`docker exec ${container} pg_isready -U postgres`, { stdio: 'ignore' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Postgres did not start in time');
}

async function main() {
  const port = 5433;
  const container = `pg-proof-archive-${Date.now()}`;
  execSync(
    `docker run -d --rm -e POSTGRES_PASSWORD=postgres -p ${port}:5432 --name ${container} postgres:15`,
    { stdio: 'ignore' },
  );

  try {
    await waitForPostgres(container);

    const dbUrl = `postgres://postgres:postgres@localhost:${port}/postgres`;
    process.env.DATABASE_URL = dbUrl;
    AppDataSource.setOptions({ url: dbUrl });

    await AppDataSource.initialize();
    await AppDataSource.runMigrations();

    const seed = randomBytes(32);
    const nonce = randomBytes(32);
    const commitment = await hashCommitment(seed, nonce);
    const handId = randomUUID();

    const repo = AppDataSource.getRepository(Hand);
    await repo.save({
      id: handId,
      log: '{}',
      commitment,
      seed: bytesToHex(seed),
      nonce: bytesToHex(nonce),
      settled: false,
    });

    const hand = await repo.findOne({ where: { id: handId } });
    if (!hand || !hand.seed || !hand.nonce) {
      throw new Error(`Hand ${handId} not found or missing proof`);
    }
    const proof = {
      seed: hand.seed,
      nonce: hand.nonce,
      commitment: hand.commitment,
    };
    if (!(await verifyProof(proof))) {
      throw new Error('Invalid proof: commitment mismatch');
    }
    const deck = await revealDeck(proof);

    const proofsDir = path.join(__dirname, '..', 'storage', 'proofs');
    await fs.rm(proofsDir, { recursive: true, force: true });
    await fs.mkdir(proofsDir, { recursive: true });
    const fileName = `${handId}.json`;
    const proofPath = path.join(proofsDir, fileName);
    await fs.writeFile(proofPath, JSON.stringify({ ...proof, deck }));
    const data = await fs.readFile(proofPath);
    const hash = createHash('sha256').update(data).digest('hex');
    await fs.writeFile(path.join(proofsDir, 'manifest.txt'), `${hash} ${fileName}\n`);

    await AppDataSource.destroy();

    execSync(`npx -y ts-node scripts/validate-proof-archive.ts`, {
      stdio: 'inherit',
      env: process.env,
    });
  } finally {
    execSync(`docker rm -f ${container}`, { stdio: 'ignore' });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
