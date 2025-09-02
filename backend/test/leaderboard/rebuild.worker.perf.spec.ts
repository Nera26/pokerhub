import { startLeaderboardRebuildWorker } from '../../src/leaderboard/rebuild.worker';
import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { writeSyntheticEvents } from './synthetic-events';
import { ConfigService } from '@nestjs/config';

jest.mock('bullmq', () => {
  class Queue {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
    async add(_name: string, _data: unknown, _opts: unknown): Promise<void> {}
  }
  class Worker {
    private readonly processor: () => Promise<void> | void;
    constructor(_name: string, processor: () => Promise<void> | void) {
      this.processor = processor;
    }
    async waitUntilReady(): Promise<void> {
      await this.processor();
    }
  }
  return { Queue, Worker };
});

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

describe('leaderboard rebuild worker performance', () => {
  it('rebuilds synthetic events within threshold', async () => {
    jest.useFakeTimers();
    const maxDurationMs = Number(
      process.env.LEADERBOARD_WORKER_MAX_MS ?? 30 * 60 * 1000,
    );
    const days = Number(process.env.LEADERBOARD_BENCH_DAYS ?? 30);
    const players = Number(process.env.LEADERBOARD_BENCH_PLAYERS ?? 10);
    const perDay = Number(process.env.LEADERBOARD_BENCH_PER_DAY ?? 100);
    await writeSyntheticEvents(days, players, perDay);
    const cache = new MockCache();
    const analytics = { ingest: jest.fn(), rangeStream: jest.fn() };
    const service = new LeaderboardService(
      cache as unknown as Cache,
      { find: jest.fn() } as any,
      analytics as any,
      new ConfigService(),
    );
    const start = process.hrtime.bigint();
    await startLeaderboardRebuildWorker(service);
    const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1_000_000));
    // eslint-disable-next-line no-console
    console.log(`worker rebuild duration: ${durationMs}ms`);
    expect(durationMs).toBeLessThan(maxDurationMs);
    jest.useRealTimers();
  });
});
