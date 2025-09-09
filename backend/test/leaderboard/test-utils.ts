import { createClient, type ClickHouseClient } from '@clickhouse/client';

export class MockCache {
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

export class ClickHouseAnalytics {
  private client: ClickHouseClient | null;

  constructor() {
    const url = process.env.CLICKHOUSE_URL;
    this.client = url ? createClient({ url }) : null;
  }

  async ingest(
    table = 'leaderboard_rebuild',
    data: Record<string, any> = { ts: Date.now() },
  ): Promise<void> {
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

export default { MockCache, ClickHouseAnalytics };
