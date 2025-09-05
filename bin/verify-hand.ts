#!/usr/bin/env ts-node
import { parseArgs } from 'node:util';
import { verifyHandProof } from './verify-proof';

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: { base: { type: 'string', short: 'b' } },
    allowPositionals: true,
  });
  const handId = positionals[0];
  const baseUrl = values.base || 'http://localhost:3000';
  if (!handId) {
    console.error('Usage: verify-hand <handId> [--base <url>]');
    process.exit(1);
  }
  try {
    await verifyHandProof(handId, baseUrl);
    console.log(`Deck verified for hand ${handId}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}

