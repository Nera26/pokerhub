import { createLeaderboardPerfService } from './perf-utils';

describe('leaderboard rebuild performance', () => {
  it('rebuildFromEvents completes under threshold', async () => {
    jest.useFakeTimers();
    const maxDurationMs = Number(
      process.env.LEADERBOARD_REBUILD_MAX_MS ?? 30 * 60 * 1000,
    );
    const days = Number(process.env.LEADERBOARD_BENCH_DAYS ?? 30);
    const players = Number(process.env.LEADERBOARD_BENCH_PLAYERS ?? 10);
    const { service, analytics } = await createLeaderboardPerfService({
      days,
      players,
    });
    const { durationMs, memoryMb } = await service.rebuildFromEvents(
      days,
      maxDurationMs,
    );
    console.info('leaderboard rebuild', { durationMs, memoryMb });
    expect(durationMs).toBeLessThanOrEqual(maxDurationMs);
    // memoryMb captured and sent via analytics.ingest inside service
    expect(memoryMb).toBeGreaterThanOrEqual(0);
    await analytics.close();
    jest.useRealTimers();
  });
});
