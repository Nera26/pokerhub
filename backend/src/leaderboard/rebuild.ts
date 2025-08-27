import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  await leaderboard.rebuild();
  await app.close();
}

void bootstrap();
