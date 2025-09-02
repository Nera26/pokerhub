import { run } from '../../src/leaderboard/rebuild';
import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { ConfigService } from '@nestjs/config';

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

class ClickHouseAnalytics {
  private client: ClickHouseClient | null;
  constructor() {
    const url = process.env.CLICKHOUSE_URL;
    this.client = url ? createClient({ url }) : null;
  }
  async ingest(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.insert({
        table: 'leaderboard_rebuild',
        values: [{ ts: Date.now() }],
        format: 'JSONEachRow',
      });
    } catch {
      // ignore
    }
  }
  async rangeStream(): Promise<any[]> {
    return [];
  }
  async close(): Promise<void> {
    await this.client?.close();
  }
}

describe('leaderboard rebuild benchmark', () => {
  it('rebuilds 30 days within 30 minutes', async () => {
    jest.useFakeTimers();
    const cache = new MockCache();
    const analytics = new ClickHouseAnalytics();
    const repo = {
      clear: jest.fn(),
      insert: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    } as any;
    const service = new LeaderboardService(
      cache as unknown as Cache,
      { find: jest.fn() } as any,
      repo,
      analytics as any,
      new ConfigService(),
    );
    const { durationMs } = await run({
      days: 30,
      benchmark: true,
      players: 5,
      sessions: 10,
      assertDurationMs: 30 * 60 * 1000,
      service,
    });
    expect(durationMs).toBeLessThan(30 * 60 * 1000);
    await analytics.close();
    jest.useRealTimers();
  });
});
