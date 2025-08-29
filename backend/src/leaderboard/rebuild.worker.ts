import { LeaderboardService } from './leaderboard.service';
import { metrics } from '@opentelemetry/api';

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
  {
    description: 'Number of successful leaderboard rebuild jobs',
  },
);
const rebuildFailure = meter.createCounter(
  'leaderboard_rebuild_job_failure_total',
  {
    description: 'Number of failed leaderboard rebuild jobs',
  },
);

export async function startLeaderboardRebuildWorker(
  leaderboard: LeaderboardService,
) {
  const bull = await import('bullmq');
  const connection = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  };
  const queue = new bull.Queue('leaderboard-rebuild', { connection });

  await queue.add(
    'rebuild',
    {},
    {
      jobId: 'leaderboard-rebuild',
      repeat: { cron: process.env.LEADERBOARD_REBUILD_CRON ?? '0 3 * * *' },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  const worker = new bull.Worker(
    'leaderboard-rebuild',
    async () => {
      const start = Date.now();
      try {
        const { durationMs } = await leaderboard.rebuildFromEvents(30);
        rebuildDuration.record(durationMs);
        if (durationMs > 30 * 60 * 1000) {
          rebuildFailure.add(1);
          throw new Error(`Rebuild exceeded 30min: ${durationMs}ms`);
        }
        rebuildSuccess.add(1);
      } catch (err) {
        const elapsed = Date.now() - start;
        rebuildDuration.record(elapsed);
        rebuildFailure.add(1);
        throw err;
      }
    },
    { connection },
  );

  await worker.waitUntilReady();
}
