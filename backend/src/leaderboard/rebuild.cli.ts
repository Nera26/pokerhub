import { NestFactory } from '@nestjs/core';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';
import { updateRating } from './rating';

async function bootstrap() {
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined =>
    args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
  const hasFlag = (name: string): boolean => args.includes(`--${name}`);

  const benchmark = hasFlag('benchmark');
  const days = Number(getArg('days') ?? 30);
  const players = Number(getArg('players') ?? 50);
  const sessions = Number(getArg('sessions') ?? 200);
  const arg = getArg('assert-duration');
  const assertMs =
    arg !== undefined ? Number(arg) : benchmark ? 30 * 60 * 1000 : undefined;

  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);

  let expected: any[] | undefined;
  let dir: string | undefined;

  if (benchmark) {
    const DAY_MS = 24 * 60 * 60 * 1000;
    dir = join(process.cwd(), 'storage', 'events');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });

    const now = Date.now();
    const playerIds = Array.from({ length: players }, (_, i) => `p${i}`);
    const events: {
      playerId: string;
      sessionId: string;
      points: number;
      ts: number;
    }[] = [];
    for (let d = 0; d < days; d++) {
      const dateStr = new Date(now - d * DAY_MS).toISOString().slice(0, 10);
      const file = join(dir, `${dateStr}.jsonl`);
      const lines: string[] = [];
      for (let i = 0; i < sessions; i++) {
        const playerId = playerIds[randomInt(playerIds.length)];
        const ev = {
          playerId,
          sessionId: `${dateStr}-${playerId}-s${i}`,
          points: randomInt(1, 21),
          ts: now - d * DAY_MS + randomInt(DAY_MS),
        };
        events.push(ev);
        lines.push(JSON.stringify(ev));
      }
      await fs.writeFile(file, lines.join('\n'));
    }
    console.log(
      `Seeded ${days} days with ${players} players (${days * sessions} sessions)`
    );

    const scores = new Map<
      string,
      {
        sessions: Set<string>;
        rating: number;
        net: number;
        bb: number;
        hands: number;
        duration: number;
      }
    >();
    for (const ev of events) {
      const entry =
        scores.get(ev.playerId) ?? {
          sessions: new Set<string>(),
          rating: 0,
          net: 0,
          bb: 0,
          hands: 0,
          duration: 0,
        };
      entry.sessions.add(ev.sessionId);
      const ageDays = (now - ev.ts) / DAY_MS;
      entry.rating = updateRating(entry.rating, ev.points, ageDays, {
        kFactor: 0.5,
        decay: 0.95,
      });
      scores.set(ev.playerId, entry);
    }
    expected = [...scores.entries()]
      .filter(([_, v]) => v.sessions.size >= 10)
      .sort((a, b) => {
        const diff = b[1].rating - a[1].rating;
        return diff !== 0 ? diff : a[0].localeCompare(b[0]);
      })
      .map(([id, v], idx) => ({
        playerId: id,
        rank: idx + 1,
        points: v.rating,
        net: v.net,
        bb100: v.hands ? (v.bb / v.hands) * 100 : 0,
        hours: v.duration / 3_600_000,
      }))
      .slice(0, 100);
    console.log('Benchmarking leaderboard rebuild from synthetic events...');
  } else {
    console.log('Rebuilding leaderboard for last 30 days from events...');
  }

  const start = process.hrtime.bigint();
  const startMem = process.memoryUsage().rss;
  await leaderboard.rebuildFromEvents(benchmark ? days : 30);
  const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  const memoryMb = (process.memoryUsage().rss - startMem) / 1024 / 1024;
  console.log(
    `Rebuild complete in ${(durationMs / 1000).toFixed(1)}s (\u0394RSS ${memoryMb.toFixed(
      1,
    )}MB)`
  );

  if (assertMs !== undefined && durationMs > assertMs) {
    console.error(
      `Rebuild exceeded assert-duration of ${assertMs}ms (took ${durationMs}ms)`
    );
    await app.close();
    if (dir) await fs.rm(dir, { recursive: true, force: true });
    process.exit(1);
  }

  if (benchmark && expected) {
    const actual = await leaderboard.getTopPlayers();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      console.error('Rebuild results differ from incremental model');
      await app.close();
      await fs.rm(dir!, { recursive: true, force: true });
      process.exit(1);
    }
  }

  await app.close();
  if (dir) await fs.rm(dir, { recursive: true, force: true });
}

void bootstrap();

