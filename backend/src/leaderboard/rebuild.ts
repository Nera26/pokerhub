import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  const days = Number.parseInt(process.argv[2] ?? '30', 10);
  await leaderboard.rebuild(days);
  await app.close();
}

void bootstrap();
