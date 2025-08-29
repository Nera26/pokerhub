import { hashCommitment, shuffle, standardDeck, type HandProof } from './rng';
import { AppDataSource } from '../database/data-source';
import { Hand } from '../database/entities/hand.entity';

async function main() {
  const [a1, a2, a3] = process.argv.slice(2);

  let proof: HandProof | undefined;

  if (a1 && !a2) {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Hand);
    const hand = await repo.findOne({ where: { id: a1 } });
    await AppDataSource.destroy();
    if (!hand || !hand.seed || !hand.nonce) {
      console.error('hand not found or missing proof');
      process.exit(1);
    }
    proof = {
      seed: hand.seed,
      nonce: hand.nonce,
      commitment: hand.commitment,
    };
  } else if (a1 && a2) {
    proof = {
      seed: a1,
      nonce: a2,
      commitment: a3 ?? hashCommitment(Buffer.from(a1, 'hex'), Buffer.from(a2, 'hex')),
    };
  }

  if (!proof) {
    console.error('Usage: ts-node verify.ts <seedHex> <nonceHex> [commitment] | ts-node verify.ts <handId>');
    process.exit(1);
  }

  const seed = Buffer.from(proof.seed, 'hex');
  const nonce = Buffer.from(proof.nonce, 'hex');
  const computed = hashCommitment(seed, nonce);
  if (proof.commitment && proof.commitment !== computed) {
    console.error('Commitment mismatch');
    process.exit(1);
  }

  const deck = shuffle(standardDeck(), seed);
  console.log(JSON.stringify({ commitment: computed, deck: deck.join(' ') }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

