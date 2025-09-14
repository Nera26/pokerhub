import { metrics } from '@opentelemetry/api';
import type { Queue } from 'bullmq';
import { Worker } from 'bullmq';
import type { LeaderboardService } from './leaderboard.service';

const meter = metrics.getMeter('leaderboard');
const rebuildDuration = meter.createHistogram(
  'leaderboard_rebuild_job_duration_ms',
  {
    description: 'Time to rebuild leaderboard from persisted events',
    unit: 'ms',
  },
);
const rebuildSuccess = meter.createCounter(
  'leaderboard_rebuild_job_success_total',
  { description: 'Number of successful leaderboard rebuild jobs' },
);
const rebuildFailure = meter.createCounter(
  'leaderboard_rebuild_job_failure_total',
  { description: 'Number of failed leaderboard rebuild jobs' },
);

export async function performRebuild(
  leaderboard: LeaderboardService,
  days: number,
  assertDurationMs?: number,
): Promise<{ durationMs: number; memoryMb: number }> {
  const start = Date.now();
  try {
    const result = await leaderboard.rebuildFromEvents(days, assertDurationMs);
    rebuildDuration.record(result.durationMs);
    if (assertDurationMs && result.durationMs > assertDurationMs) {
      rebuildFailure.add(1);
      throw new Error(`Rebuild exceeded ${assertDurationMs}ms: ${result.durationMs}ms`);
    }
    rebuildSuccess.add(1);
    return result;
  } catch (err) {
    const elapsed = Date.now() - start;
    rebuildDuration.record(elapsed);
    rebuildFailure.add(1);
    throw err;
  }
}

export async function scheduleRebuild(
  queue: Queue,
  leaderboard: LeaderboardService,
  days: number,
  cron: string,
  assertDurationMs?: number,
): Promise<void> {
  await queue.add(
    'rebuild',
    { days },
    {
      jobId: 'leaderboard-rebuild',
      repeat: { cron },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  const worker = new Worker(
    queue.name,
    async (job) => {
      const jobDays: number = job.data?.days ?? days;
      await performRebuild(leaderboard, jobDays, assertDurationMs);
    },
    { connection: queue.opts.connection },
  );

  await worker.waitUntilReady();
}
