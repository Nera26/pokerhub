import crypto from 'crypto';
import { GameEngine, GameAction } from './engine';
import { hashCommitment, verifyProof } from './rng';

describe('GameEngine hand lifecycle', () => {
  it('plays through a hand, settles pot and verifies RNG proof', async () => {
    const spy = jest.spyOn(crypto, 'randomBytes').mockImplementation((size: number) => {
      if (size === 32) return Buffer.alloc(32, 1);
      if (size === 16) return Buffer.alloc(16, 2);
      throw new Error(`unexpected randomBytes size: ${size}`);
    });

    const wallet = {
      reserve: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    } as any;

    const engine = await GameEngine.create(['A', 'B'], wallet);
    const handId = engine.getHandId();

    const actions: GameAction[] = [
      { type: 'postBlind', playerId: 'A', amount: 1 },
      { type: 'postBlind', playerId: 'B', amount: 2 },
      { type: 'next' },
      { type: 'bet', playerId: 'A', amount: 4 },
      { type: 'fold', playerId: 'B' },
    ];

    for (const action of actions) {
      engine.applyAction(action);
    }
    await new Promise((r) => setImmediate(r));

    const state = engine.getState();
    expect(state.phase).toBe('SETTLE');
    expect(engine.getSettlements()).toEqual([
      { playerId: 'A', delta: 2 },
      { playerId: 'B', delta: -2 },
    ]);

    expect(wallet.reserve).toHaveBeenCalledTimes(2);
    expect(wallet.rollback).toHaveBeenCalledWith('A', 100, handId, 'USD');
    expect(wallet.rollback).toHaveBeenCalledWith('B', 98, handId, 'USD');
    expect(wallet.commit).toHaveBeenCalledWith(handId, 2, 0, 'USD');

    const proof = engine.getHandProof()!;
    expect(verifyProof(proof)).toBe(true);
    expect(proof.commitment).toBe(
      hashCommitment(Buffer.alloc(32, 1), Buffer.alloc(16, 2)),
    );

    spy.mockRestore();
  });
});
