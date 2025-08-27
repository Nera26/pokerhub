import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  const daysArg = process.argv[2];
  const days = daysArg ? Number(daysArg) : 30;
  await leaderboard.rebuild({ days });
  await app.close();
}

void bootstrap();
