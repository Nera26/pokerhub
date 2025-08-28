import crypto from 'crypto';
import { GameEngine, GameAction } from '../../src/game/engine';
import { hashCommitment } from '../../src/game/rng';

describe('GameEngine RNG proof logging', () => {
  it('appends proof to hand log at showdown', () => {
    const spy = jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
      if (size === 32) return Buffer.alloc(32, 1);
      if (size === 16) return Buffer.alloc(16, 2);
      throw new Error(`unexpected randomBytes size: ${size}`);
    });

    const engine = new GameEngine(['A', 'B']);
    spy.mockRestore();

    const actions: GameAction[] = [
      { type: 'postBlind', playerId: 'A', amount: 1 },
      { type: 'postBlind', playerId: 'B', amount: 2 },
      { type: 'bet', playerId: 'A', amount: 4 },
      { type: 'fold', playerId: 'B' },
    ];

    for (const action of actions) {
      engine.applyAction(action);
    }

    const last = engine.getHandLog().at(-1);
    expect(last?.[4]).toEqual({
      commitment: hashCommitment(Buffer.alloc(32, 1), Buffer.alloc(16, 2)),
      seed: Buffer.alloc(32, 1).toString('hex'),
      nonce: Buffer.alloc(16, 2).toString('hex'),
    });
  });
});
