import crypto from 'crypto';
import path from 'path';
import { readFileSync } from 'fs';
import { GameEngine, GameAction } from './engine';

describe('GameEngine determinism', () => {
  it('produces identical logs for fixed seed and actions', async () => {
    const seed = Buffer.alloc(32, 1);
    const nonce = Buffer.alloc(16, 2);
    const spy = jest
      .spyOn(crypto, 'randomBytes')
      .mockImplementation((size: number) => {
        if (size === 32) return Buffer.from(seed);
        if (size === 16) return Buffer.from(nonce);
        throw new Error(`unexpected randomBytes size: ${size}`);
      });

    const actions = JSON.parse(
      readFileSync(
        path.resolve(__dirname, 'engine', 'deterministic.actions.json'),
        'utf8',
      ),
    ) as GameAction[];

    const config = { startingStack: 100, smallBlind: 1, bigBlind: 2 };

    const engine1 = await GameEngine.create(['A', 'B'], config);
    actions.forEach((a) => engine1.applyAction(a));
    await new Promise((r) => setImmediate(r));

    const engine2 = await GameEngine.create(['A', 'B'], config);
    actions.forEach((a) => engine2.applyAction(a));
    await new Promise((r) => setImmediate(r));

    const log1 = Buffer.from(JSON.stringify(engine1.getHandLog()));
    const log2 = Buffer.from(JSON.stringify(engine2.getHandLog()));

    expect(log1.equals(log2)).toBe(true);

    spy.mockRestore();
  });
});
