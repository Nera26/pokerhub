import { hashCommitment, shuffle, standardDeck } from './rng';

function main() {
  const [seedHex, nonceHex, commitment] = process.argv.slice(2);
  if (!seedHex || !nonceHex) {
    console.error('Usage: ts-node verify.ts <seedHex> <nonceHex> [commitment]');
    process.exit(1);
  }

  const seed = Buffer.from(seedHex, 'hex');
  const nonce = Buffer.from(nonceHex, 'hex');
  const computed = hashCommitment(seed, nonce);
  if (commitment && commitment !== computed) {
    console.error('Commitment mismatch');
    process.exit(1);
  }

  const deck = shuffle(standardDeck(), seed);
  console.log('commitment:', computed);
  console.log('deck:', deck.join(' '));
}

main();
