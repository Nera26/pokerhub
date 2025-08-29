import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  const timeoutMs = 30 * 60 * 1000;
  const timeout = setTimeout(() => {
    console.error(`Leaderboard rebuild exceeded ${timeoutMs}ms`);
    void app.close().finally(() => process.exit(1));
  }, timeoutMs);

  try {
    const { durationMs, memoryMb } = await leaderboard.rebuildFromEvents(30);
    clearTimeout(timeout);
    console.log(
      `Rebuild complete in ${(durationMs / 1000).toFixed(1)}s (\u0394RSS ${memoryMb.toFixed(
        1,
      )}MB)`,
    );
    if (durationMs > timeoutMs) {
      console.error(
        `Rebuild exceeded timeout of ${timeoutMs}ms (took ${durationMs}ms)`,
      );
      process.exitCode = 1;
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error('Leaderboard rebuild failed', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
