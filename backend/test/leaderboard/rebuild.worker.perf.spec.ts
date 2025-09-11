import { startLeaderboardRebuildWorker } from '../../src/leaderboard/rebuild.worker';
import { createLeaderboardPerfService } from './perf-utils';

jest.mock('../../src/redis/queue', () => ({
  createQueue: jest.fn().mockResolvedValue({
    add: jest.fn(),
    opts: { connection: {} },
  }),
}));

jest.mock('bullmq', () => {
  class Queue {
    opts = { connection: {} };
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

describe('leaderboard rebuild worker performance', () => {
  it('rebuilds synthetic events within threshold', async () => {
    jest.useFakeTimers();
    const maxDurationMs = Number(
      process.env.LEADERBOARD_WORKER_MAX_MS ?? 30 * 60 * 1000,
    );
    const days = Number(process.env.LEADERBOARD_BENCH_DAYS ?? 30);
    const players = Number(process.env.LEADERBOARD_BENCH_PLAYERS ?? 10);
    const perDay = Number(process.env.LEADERBOARD_BENCH_PER_DAY ?? 100);
    const { service, analytics } = await createLeaderboardPerfService({
      days,
      players,
      perDay,
    });
    const start = process.hrtime.bigint();
    await startLeaderboardRebuildWorker(service);
    const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1_000_000));
    // eslint-disable-next-line no-console
    console.log(`worker rebuild duration: ${durationMs}ms`);
    expect(durationMs).toBeLessThan(maxDurationMs);
    await analytics.close();
    jest.useRealTimers();
  });
});
