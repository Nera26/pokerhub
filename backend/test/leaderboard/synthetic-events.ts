import { promises as fs } from 'fs';
import { join } from 'path';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function writeSyntheticEvents(
  days: number,
  players = 10,
  perDay = 100,
): Promise<void> {
  const dir = join(process.cwd(), 'storage', 'events');
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  const now = Date.now();
  for (let d = 0; d < days; d++) {
    const dateStr = new Date(now - d * DAY_MS).toISOString().slice(0, 10);
    const file = join(dir, `${dateStr}.jsonl`);
    const lines: string[] = [];
    for (let i = 0; i < perDay; i++) {
      lines.push(
        JSON.stringify({
          playerId: `p${i % players}`,
          sessionId: `${dateStr}-s${i}`,
          points: 10,
          ts: now - d * DAY_MS,
        }),
      );
    }
    await fs.writeFile(file, lines.join('\n'));
  }
}
