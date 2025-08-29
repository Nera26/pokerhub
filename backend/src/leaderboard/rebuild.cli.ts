import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  console.log('Rebuilding leaderboard for last 30 days from events...');
  const { durationMs, memoryMb } = await leaderboard.rebuildFromEvents(30);
  console.log(
    `Rebuild complete in ${(durationMs / 1000).toFixed(1)}s (RSS ${memoryMb.toFixed(
      1,
    )}MB)`,
  );
  await app.close();
}

void bootstrap();
