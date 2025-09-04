#!/usr/bin/env ts-node
import { promises as fs } from 'fs';
import { join } from 'path';
import { Module } from 'module';
import type { Cache } from 'cache-manager';
import type { Repository } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import type { AnalyticsService } from '../src/analytics/analytics.service';
import type { Leaderboard } from '../src/database/entities/leaderboard.entity';
import type { User } from '../src/database/entities/user.entity';
import { LeaderboardService } from '../src/leaderboard/leaderboard.service';
import { startLeaderboardRebuildWorker } from '../src/leaderboard/rebuild.worker';

// Use test helper bullmq stub
process.env.NODE_PATH = join(__dirname, '../test/utils');
(Module._initPaths as () => void)();

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
  private store = new Map<string, unknown>();
  get<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.store.get(key) as T | undefined);
  }
  set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
  del(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }
}

const mockConfig = {
  get<T>(_: string, defaultValue: T): T {
    return defaultValue;
  },
};

async function main(): Promise<void> {
  const maxDurationMs = Number(
    process.env.LEADERBOARD_WORKER_MAX_MS ?? 30 * 60 * 1000,
  );
  await writeSyntheticEvents(30);
  const cache = new MockCache() as unknown as Cache;
  const analytics = {
    ingest: () => Promise.resolve(),
    rangeStream: () => Promise.resolve([]),
  } as unknown as AnalyticsService;
  const repo = {
    clear: () => Promise.resolve(),
    insert: () => Promise.resolve(),
    find: () => Promise.resolve([]),
  } as unknown as Repository<Leaderboard>;
  const service = new LeaderboardService(
    cache,
    { find: () => Promise.resolve([]) } as unknown as Repository<User>,
    repo,
    analytics,
    mockConfig as unknown as ConfigService,
  );
  const start = process.hrtime.bigint();
  await startLeaderboardRebuildWorker(service);
  const durationMs = Number(
    (process.hrtime.bigint() - start) / BigInt(1_000_000),
  );
  console.log(`worker rebuild duration: ${durationMs}ms`);
  if (durationMs > maxDurationMs) {
    throw new Error(`Rebuild exceeded ${maxDurationMs}ms`);
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
