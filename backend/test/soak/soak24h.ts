import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { GameEngine } from '../../src/game/engine';

// Directory containing recorded hand logs
const logsDir = join(__dirname, '../../../storage/hand-logs');
const files = readdirSync(logsDir).filter((f) => f.endsWith('.jsonl'));
if (files.length === 0) {
  console.error('No hand logs found in', logsDir);
  process.exit(1);
}

// Capture GC pause durations from --trace-gc output
const gcPauses: number[] = [];
const origWrite = process.stderr.write.bind(process.stderr);
(process.stderr as unknown as { write: typeof process.stderr.write }).write = (
  chunk: any,
  encoding?: any,
  cb?: any,
) => {
  const str = chunk.toString();
  const match = str.match(/\s(\d+(?:\.\d+)?) ms:/);
  if (match) {
    gcPauses.push(parseFloat(match[1]));
  }
  return origWrite(chunk, encoding, cb);
};

const startHeap = process.memoryUsage().heapUsed;
const endTime = Date.now() + 24 * 60 * 60 * 1000; // 24h
let nextLog = Date.now();

while (Date.now() < endTime) {
  for (const file of files) {
    const lines = readFileSync(join(logsDir, file), 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean);
    if (lines.length === 0) continue;
    const first = JSON.parse(lines[0]);
    const players = (first[2]?.players ?? []).map((p: any) => p.id);
    const engine = new GameEngine(players);
    for (const line of lines) {
      const entry = JSON.parse(line);
      const action = entry[1];
      engine.applyAction(action);
    }
    if (Date.now() >= nextLog) {
      const heapMb = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`Heap used: ${heapMb.toFixed(2)} MB`);
      nextLog = Date.now() + 60 * 1000; // log every minute
    }
  }
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
