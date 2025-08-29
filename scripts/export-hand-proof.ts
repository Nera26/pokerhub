#!/usr/bin/env ts-node
import 'dotenv/config';
import { AppDataSource } from '../backend/src/database/data-source';
import { Hand } from '../backend/src/database/entities/hand.entity';
import { revealDeck, verifyProof } from '../shared/verify';
import type { HandProof } from '../shared/types';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  const handId = process.argv[2];
  if (!handId) {
    console.error('Usage: ts-node scripts/export-hand-proof.ts <handId>');
    process.exit(1);
  }

  await AppDataSource.initialize();
  try {
    const repo = AppDataSource.getRepository(Hand);
    const hand = await repo.findOne({ where: { id: handId } });
    if (!hand || !hand.seed || !hand.nonce) {
      console.error(`Hand ${handId} not found or missing proof`);
      process.exit(1);
    }

    const proof: HandProof = {
      seed: hand.seed,
      nonce: hand.nonce,
      commitment: hand.commitment,
    };

    if (!(await verifyProof(proof))) {
      console.error('Invalid proof: commitment mismatch');
      process.exit(1);
    }

    const deck = await revealDeck(proof);
    const exportData = { ...proof, deck };

    const dir = path.join(__dirname, '..', 'storage', 'proofs');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${handId}.json`);
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    console.log(JSON.stringify(exportData));
    console.error(`Proof saved to ${filePath}`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
