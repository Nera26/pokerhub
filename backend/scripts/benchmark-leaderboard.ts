#!/usr/bin/env ts-node
import { promises as fs } from 'fs';
import { join } from 'path';
import { LeaderboardService } from '../src/leaderboard/leaderboard.service';
import { startLeaderboardRebuildWorker } from '../src/leaderboard/rebuild.worker';

// Allow local bullmq stub in this directory
process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

const DAY_MS = 24 * 60 * 60 * 1000;

async function writeSyntheticEvents(
  days: number,
  players = 10,
  perDay = 100,
): Promise<void> {
  const dir = join(process.cwd(), 'storage', 'events');
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  const now = Date.now();
  for (let d = 0; d < days; d++) {
    const dateStr = new Date(now - d * DAY_MS).toISOString().slice(0, 10);
    const file = join(dir, `${dateStr}.jsonl`);
    const lines: string[] = [];
    for (let i = 0; i < perDay; i++) {
      lines.push(
        JSON.stringify({
          playerId: `p${i % players}`,
          sessionId: `${dateStr}-s${i}`,
          points: 10,
          ts: now - d * DAY_MS,
        }),
      );
    }
    await fs.writeFile(file, lines.join('\n'));
  }
}

class MockCache {
  private store = new Map<string, any>();
  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key);
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class MockConfigService {
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  get<T>(_key: string, defaultValue: T): T {
    return defaultValue;
  }
}

async function main(): Promise<void> {
  const maxDurationMs = Number(
    process.env.LEADERBOARD_WORKER_MAX_MS ?? 30 * 60 * 1000,
  );
  await writeSyntheticEvents(30);
  const cache = new MockCache();
  const analytics = { ingest: async () => {}, rangeStream: async () => [] };
  const repo = {
    clear: async () => {},
    insert: async () => {},
    find: async () => [],
  } as any;
  const service = new LeaderboardService(
    cache as any,
    { find: async () => [] } as any,
    repo,
    analytics as any,
    new MockConfigService() as any,
  );
  const start = process.hrtime.bigint();
  await startLeaderboardRebuildWorker(service);
  const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1_000_000));
  console.log(`worker rebuild duration: ${durationMs}ms`);
  if (durationMs > maxDurationMs) {
    throw new Error(`Rebuild exceeded ${maxDurationMs}ms`);
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
