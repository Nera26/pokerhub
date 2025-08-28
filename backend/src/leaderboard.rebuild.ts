import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LeaderboardService } from './leaderboard/leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);

  const start = Date.now();
  console.log('Rebuilding leaderboard for last 30 days...');
  await leaderboard.rebuild({ days: 30 });
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Rebuild complete in ${duration}s`);

  await app.close();
}

void bootstrap();
