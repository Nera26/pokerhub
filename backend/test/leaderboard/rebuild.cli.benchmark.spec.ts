import { run } from '../../src/leaderboard/rebuild';
import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { createClient, ClickHouseClient } from '@clickhouse/client';

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

describe('leaderboard rebuild CLI benchmark', () => {
  it('completes within configured duration', async () => {
    jest.useFakeTimers();
    const cache = new MockCache();
    const analytics = new ClickHouseAnalytics();
    const service = new LeaderboardService(
      cache as unknown as Cache,
      { find: jest.fn() } as any,
      analytics as any,
    );
    const { durationMs } = await run({
      days: 1,
      benchmark: true,
      players: 5,
      sessions: 10,
      assertDurationMs: 60_000,
      service,
    });
    expect(durationMs).toBeLessThan(60_000);
    await analytics.close();
    jest.useRealTimers();
  });
});

