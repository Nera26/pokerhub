#!/usr/bin/env ts-node
import { readdirSync, readFileSync, promises as fs } from 'fs';
import path from 'path';

async function main(): Promise<void> {
  const root = process.cwd();
  const dir = path.join(root, '../storage/hand-logs');
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
    const balances = new Map<string, number>();
    for (const file of files) {
      const lines = readFileSync(path.join(dir, file), 'utf8')
        .split('\n')
        .filter(Boolean);
      for (const [idx, line] of lines.entries()) {
        const { accounts = {} } = JSON.parse(line) as { accounts?: Record<string, number> };
        const total = Object.values(accounts).reduce((s, v) => s + Number(v), 0);
        if (total !== 0) {
          throw new Error(`non-zero batch total ${total} in ${file} line ${idx + 1}`);
        }
        for (const [id, amt] of Object.entries(accounts)) {
          balances.set(id, (balances.get(id) ?? 0) + Number(amt));
        }
      }
    }
    const sum = Array.from(balances.values()).reduce((a, b) => a + b, 0);
    if (sum !== 0) {
      const outDir = path.join(root, '../storage');
      await fs.mkdir(outDir, { recursive: true });
      const today = new Date().toISOString().slice(0, 10);
      const outFile = path.join(outDir, `replay-discrepancy-${today}.json`);
      await fs.writeFile(
        outFile,
        JSON.stringify({ balances: Object.fromEntries(balances), total: sum }, null, 2),
      );
      throw new Error(`ledger imbalance detected: total ${sum}`);
    }
    console.log('Ledger replay verified: all account balances sum to zero');
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      console.log('No hand logs found, skipping replay');
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

