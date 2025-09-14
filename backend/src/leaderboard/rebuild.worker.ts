import { LeaderboardService } from './leaderboard.service';
import { createQueue } from '../redis/queue';
import { scheduleRebuild } from './rebuild.core';

export async function startLeaderboardRebuildWorker(
  leaderboard: LeaderboardService,
  days = 30,
  cron = process.env.LEADERBOARD_REBUILD_CRON ?? '0 3 * * *',
  assertDurationMs = 30 * 60 * 1000,
) {
  const queue = await createQueue('leaderboard-rebuild');
  await scheduleRebuild(queue, leaderboard, days, cron, assertDurationMs);
}
