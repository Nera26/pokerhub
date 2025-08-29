import crypto from 'crypto';
import fc from 'fast-check';
import { GameEngine, GameAction } from './engine';
import { hashCommitment, verifyProof } from './rng';

const players = ['p1', 'p2'];
const actionArb: fc.Arbitrary<GameAction> = fc.oneof(
  fc.record({
    type: fc.constant('bet'),
    playerId: fc.constantFrom(...players),
    amount: fc.integer({ min: 0, max: 5 }),
  }),
  fc.record({
    type: fc.constant('call'),
    playerId: fc.constantFrom(...players),
    amount: fc.integer({ min: 0, max: 5 }),
  }),
  fc.record({
    type: fc.constant('fold'),
    playerId: fc.constantFrom(...players),
  }),
  fc.record({ type: fc.constant('next') }),
);

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

const itIfCI = process.env.CI ? it : it.skip;

itIfCI('replays identically for same seed and actions', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(actionArb, { maxLength: 20 }),
      fc.uint8Array({ minLength: 32, maxLength: 32 }),
      fc.uint8Array({ minLength: 16, maxLength: 16 }),
      async (actions, seedArr, nonceArr) => {
        const seed = Buffer.from(seedArr);
        const nonce = Buffer.from(nonceArr);
        const spy = jest
          .spyOn(crypto, 'randomBytes')
          .mockImplementation((size: number) => {
            if (size === 32) return Buffer.from(seed);
            if (size === 16) return Buffer.from(nonce);
            throw new Error(`unexpected randomBytes size: ${size}`);
          });

        const engine1 = await GameEngine.create(players);
        actions.forEach((a) => engine1.applyAction(a));

        const engine2 = await GameEngine.create(players);
        actions.forEach((a) => engine2.applyAction(a));

        const log1 = Buffer.from(JSON.stringify(engine1.getHandLog()));
        const log2 = Buffer.from(JSON.stringify(engine2.getHandLog()));
        expect(log1.equals(log2)).toBe(true);

        spy.mockRestore();
      },
    ),
  );
});
