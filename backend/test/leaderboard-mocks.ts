export class MockCache {
  private store = new Map<string, any>();
  private ttl = new Map<string, number>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T, options?: { ttl: number }): Promise<void> {
    this.store.set(key, value);
    if (options?.ttl) {
      this.ttl.set(key, options.ttl);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.ttl.delete(key);
  }
}

export class MockLeaderboardRepo {
  rows: any[] = [];

  async clear(): Promise<void> {
    this.rows = [];
  }

  async insert(entries: any[]): Promise<void> {
    this.rows.push(...entries);
  }

  async find(): Promise<any[]> {
    return [...this.rows];
  }
}

export class MockAnalytics {
  events: any[] = [];

  async rangeStream(_stream: string, since: number): Promise<any[]> {
    return this.events.filter((e) => e.ts >= since);
  }

  async ingest(): Promise<void> {
    return Promise.resolve();
  }

  async select(_sql: string): Promise<any[]> {
    return Promise.resolve([]);
  }
}
