#!/usr/bin/env ts-node
import { parseArgs } from 'node:util';
import { verifyHandProof } from './verify-proof';

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: { base: { type: 'string', short: 'b' } },
    allowPositionals: true,
  });
  const sub = positionals[0];
  const handId = positionals[1];
  const baseUrl = values.base || 'http://localhost:3000';

  if (!sub || !handId) {
    console.error('Usage: verify <proof|hand> <handId> [--base <url>]');
    process.exit(1);
  }

  try {
    await verifyHandProof(handId, baseUrl);
    if (sub === 'proof') {
      console.log(`Proof verified for hand ${handId}`);
    } else if (sub === 'hand') {
      console.log(`Deck verified for hand ${handId}`);
    } else {
      console.error(`Unknown subcommand: ${sub}`);
      process.exit(1);
    }
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
