import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LeaderboardService } from './leaderboard/leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);

  const days = Number(process.argv[2] ?? 30);
  const start = Date.now();
  console.log(`Rebuilding leaderboard for last ${days} days...`);
  await leaderboard.rebuild({ days });
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Rebuild complete in ${duration}s`);

  await app.close();
}

void bootstrap();
