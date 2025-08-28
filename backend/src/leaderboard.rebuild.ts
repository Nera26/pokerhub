import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LeaderboardService } from './leaderboard/leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  const args = process.argv.slice(2);
  let days = 30;
  const idx = args.indexOf('--days');
  if (idx !== -1 && args[idx + 1]) {
    days = Number(args[idx + 1]);
  }
  const start = Date.now();
  console.log(`Rebuilding leaderboard for last ${days} days from events...`);
  await leaderboard.rebuildFromEvents(days);
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Rebuild complete in ${duration}s`);

  await app.close();
}

void bootstrap();
