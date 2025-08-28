import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);

  const [daysArg] = process.argv.slice(2);
  const days = daysArg ? Number(daysArg) : 30;

  console.log(`Rebuilding leaderboard for last ${days} days...`);
  const start = Date.now();
  await leaderboard.rebuild({ days });
  const duration = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`Rebuild complete in ${duration}s`);

  await app.close();
}

void bootstrap();
