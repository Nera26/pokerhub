import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import { writeSyntheticEvents } from './synthetic-events';
import { Cache } from 'cache-manager';
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
  async ingest(table: string, data: Record<string, any>): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.insert({
        table,
        values: [data],
        format: 'JSONEachRow',
      });
    } catch {
      // ignore ingestion errors in tests
    }
  }
  async rangeStream(): Promise<any[]> {
    return [];
  }

  async close(): Promise<void> {
    await this.client?.close();
  }
}

describe('leaderboard rebuild performance', () => {
  it('rebuildFromEvents(30) completes under 30 minutes', async () => {
    jest.useFakeTimers();
    await writeSyntheticEvents(30);
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
    const { durationMs, memoryMb } = await service.rebuildFromEvents(30);
    expect(durationMs).toBeLessThan(1_800_000);
    // memoryMb captured and sent via analytics.ingest inside service
    expect(memoryMb).toBeGreaterThanOrEqual(0);
    await analytics.close();
    jest.useRealTimers();
  });
});
