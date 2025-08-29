#!/usr/bin/env ts-node
import 'dotenv/config';
import { AppDataSource } from '../database/data-source';
import { Hand } from '../database/entities/hand.entity';

async function main() {
  const handId = process.argv[2];
  if (!handId) {
    console.error('Usage: export-proofs <handId>');
    process.exit(1);
  }

  await AppDataSource.initialize();
  try {
    const repo = AppDataSource.getRepository(Hand);
    const hand = await repo.findOne({ where: { id: handId } });
    if (!hand) {
      console.error(`Hand ${handId} not found`);
      process.exit(1);
    }

    console.log(
      JSON.stringify({
        id: hand.id,
        seed: hand.seed,
        nonce: hand.nonce,
        commitment: hand.commitment,
      }),
    );
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
