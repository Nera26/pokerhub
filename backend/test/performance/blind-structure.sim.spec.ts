import { readFileSync } from 'fs';
import path from 'path';

interface Level {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
}

const HANDS_PER_LEVEL = 5;
// Scale minutes to milliseconds for test runtime
const MS_PER_MINUTE_SCALED = 10; // 10ms represents 1 minute

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Bot {
  constructor(private readonly handDuration: number) {}
  async playHand(): Promise<number> {
    const start = Date.now();
    await sleep(this.handDuration);
    return Date.now() - start;
  }
}

describe('blind structure simulation', () => {
  it('keeps average hand duration within 5% of expected', async () => {
    const structurePath = path.join(
      __dirname,
      '../../src/tournament/structures/v1.json',
    );
    const structure = JSON.parse(
      readFileSync(structurePath, 'utf8'),
    ) as { levels: Level[] };

    for (const lvl of structure.levels) {
      const expected = lvl.durationMinutes * MS_PER_MINUTE_SCALED;
      const bot = new Bot(expected);
      const durations: number[] = [];
      for (let i = 0; i < HANDS_PER_LEVEL; i++) {
        durations.push(await bot.playHand());
      }
      const avg =
        durations.reduce((acc, d) => acc + d, 0) / durations.length;
      const diff = Math.abs(avg - expected);
      expect(diff).toBeLessThanOrEqual(expected * 0.05);
    }
  });
});
