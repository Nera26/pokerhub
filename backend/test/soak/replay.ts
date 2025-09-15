import { readdirSync } from 'fs';
import { join } from 'path';
import { GameEngine } from '../../src/game/engine';
import { collectGcPauses, replayHandLogs } from './utils';

// Directory containing recorded hand logs
const logsDir = join(__dirname, '../../../storage/hand-logs');
const files = readdirSync(logsDir)
  .filter((f) => f.endsWith('.jsonl'))
  .map((f) => join(logsDir, f));
if (files.length === 0) {
  console.error('No hand logs found in', logsDir);
  process.exit(1);
}

const gcPauses = collectGcPauses();

const startHeap = process.memoryUsage().heapUsed;
const endTime = Date.now() + 24 * 60 * 60 * 1000; // 24h

async function run() {
  while (Date.now() < endTime) {
    await replayHandLogs(files, (players) =>
      GameEngine.create(players, {
        startingStack: 100,
        smallBlind: 1,
        bigBlind: 2,
      }),
    );
  }

  const endHeap = process.memoryUsage().heapUsed;
  const growth = (endHeap - startHeap) / startHeap;

  gcPauses.sort((a, b) => a - b);
  const p95Index = Math.floor(gcPauses.length * 0.95);
  const p95 = gcPauses[p95Index] || 0;

  if (growth > 0.01) {
    console.error(`Memory growth ${(growth * 100).toFixed(2)}% exceeds 1%`);
    process.exit(1);
  }

  if (p95 > 50) {
    console.error(`GC pause p95 ${p95.toFixed(2)}ms exceeds 50ms`);
    process.exit(1);
  }

  console.log('Soak test passed: memory stable and GC pauses within limits');
}

run();
