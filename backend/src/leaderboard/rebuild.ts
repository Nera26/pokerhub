import { NestFactory } from '@nestjs/core';
import { LeaderboardService } from './leaderboard.service';
import type { INestApplicationContext } from '@nestjs/common';
import { performRebuild } from './rebuild.core';

interface RebuildOptions {
  days?: number;
  benchmark?: boolean;
  players?: number;
  sessions?: number;
  assertDurationMs?: number;
  service?: LeaderboardService;
}

async function run(options: RebuildOptions = {}): Promise<{
  durationMs: number;
  memoryMb: number;
}> {
  const days = options.days ?? 30;
  let app: INestApplicationContext | undefined;
  const service: LeaderboardService = options.service ??
    (await (async () => {
      const { AppModule } = await import('../app.module');
      app = await NestFactory.createApplicationContext(AppModule);
      return app.get(LeaderboardService);
    })());

  try {
    if (options.benchmark) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { writeSyntheticEvents } = require('../../test/leaderboard/synthetic-events');
      const players = options.players ?? 50;
      const sessions = options.sessions ?? 200;
      await writeSyntheticEvents(days, players, sessions);
    }

    const { durationMs, memoryMb } = await performRebuild(
      service,
      days,
      options.assertDurationMs,
    );
    console.log(
      `Rebuild complete in ${(durationMs / 1000).toFixed(1)}s (\u0394RSS ${memoryMb.toFixed(
        1,
      )}MB)`,
    );
    return { durationMs, memoryMb };
  } finally {
    await app?.close();
  }
}

function parseArgs(argv: string[]): RebuildOptions {
  const opts: RebuildOptions = {};
  for (const arg of argv) {
    if (arg === '--benchmark') {
      opts.benchmark = true;
    } else if (arg.startsWith('--days=')) {
      opts.days = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--players=')) {
      opts.players = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--sessions=')) {
      opts.sessions = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--assert-duration=')) {
      opts.assertDurationMs = Number(arg.split('=')[1]);
    }
  }
  return opts;
}

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  void run(opts).catch((err) => {
    console.error('Leaderboard rebuild failed', err);
    process.exit(1);
  });
}

export { run };

