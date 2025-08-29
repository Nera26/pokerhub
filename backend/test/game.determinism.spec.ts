import crypto from 'crypto';
import { GameEngine, GameAction } from '../src/game/engine';

describe('GameEngine determinism', () => {
  it('produces identical hand logs for same seed and actions', async () => {
    const spy = jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
      if (size === 32) return Buffer.alloc(32, 1);
      if (size === 16) return Buffer.alloc(16, 2);
      throw new Error(`unexpected randomBytes size: ${size}`);
    });

    const config = { startingStack: 100, smallBlind: 1, bigBlind: 2 };
    const engineA = await GameEngine.create(['A', 'B'], config);
    const engineB = await GameEngine.create(['A', 'B'], config);

    spy.mockRestore();

    const actions: GameAction[] = [
      { type: 'postBlind', playerId: 'A', amount: 1 },
      { type: 'postBlind', playerId: 'B', amount: 2 },
      { type: 'bet', playerId: 'A', amount: 4 },
      { type: 'call', playerId: 'B' },
      { type: 'next' },
      { type: 'check', playerId: 'A' },
      { type: 'bet', playerId: 'B', amount: 4 },
      { type: 'fold', playerId: 'A' },
    ];

    for (const action of actions) {
      engineA.applyAction(action);
      engineB.applyAction(action);
    }

    expect(engineA.getHandLog()).toEqual(engineB.getHandLog());
  });
});

