import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';

async function bootstrap() {
  const arg = process.argv.find((a) => a.startsWith('--assert-duration='));
  const assertMs = arg ? Number(arg.split('=')[1]) : undefined;
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  console.log('Rebuilding leaderboard for last 30 days from events...');
  const start = process.hrtime.bigint();
  const startMem = process.memoryUsage().rss;
  await leaderboard.rebuildFromEvents(30);
  const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  const memoryMb = (process.memoryUsage().rss - startMem) / 1024 / 1024;
  console.log(
    `Rebuild complete in ${(durationMs / 1000).toFixed(1)}s (\u0394RSS ${memoryMb.toFixed(
      1,
    )}MB)`,
  );
  if (assertMs !== undefined && durationMs > assertMs) {
    console.error(
      `Rebuild exceeded assert-duration of ${assertMs}ms (took ${durationMs}ms)`,
    );
    await app.close();
    process.exit(1);
  }
  await app.close();
}

void bootstrap();
