import { NestFactory } from '@nestjs/core';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';
import { AppModule } from '../app.module';
import { LeaderboardService } from './leaderboard.service';
import { updateRating } from './rating';

async function bootstrap() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const DAYS = 30; // seed one month of data
  const PLAYERS = 50;
  const SESSIONS_PER_DAY = 200;

  const dir = join(process.cwd(), 'storage', 'events');
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });

  const now = Date.now();
  const players = Array.from({ length: PLAYERS }, (_, i) => `p${i}`);
  const events: {
    playerId: string;
    sessionId: string;
    points: number;
    ts: number;
  }[] = [];
  for (let d = 0; d < DAYS; d++) {
    const dateStr = new Date(now - d * DAY_MS).toISOString().slice(0, 10);
    const file = join(dir, `${dateStr}.jsonl`);
    const lines: string[] = [];
    for (let i = 0; i < SESSIONS_PER_DAY; i++) {
      const playerId = players[randomInt(players.length)];
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
    `Seeded ${DAYS} days with ${PLAYERS} players (${DAYS * SESSIONS_PER_DAY} sessions)`,
  );

  // incremental model
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
    const entry = scores.get(ev.playerId) ?? {
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
  const expected = [...scores.entries()]
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
      hours: v.duration / 3600000,
    }))
    .slice(0, 100);

  const app = await NestFactory.createApplicationContext(AppModule);
  const leaderboard = app.get(LeaderboardService);
  console.log('Benchmarking leaderboard rebuild from synthetic events...');
  const { durationMs } = await leaderboard.rebuildFromEvents(30);
  console.log(`Rebuild completed in ${(durationMs / 1000).toFixed(1)}s`);
  if (durationMs > 30 * 60 * 1000) {
    console.error('Rebuild exceeded 30 minute limit');
    await app.close();
    process.exit(1);
  }
  const actual = await leaderboard.getTopPlayers();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error('Rebuild results differ from incremental model');
    await app.close();
    process.exit(1);
  }
  await app.close();
  await fs.rm(dir, { recursive: true, force: true });
}

void bootstrap();
