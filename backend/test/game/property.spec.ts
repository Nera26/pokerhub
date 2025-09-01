import fc from 'fast-check';
import {
  GameEngine,
  GameAction,
  InternalGameState,
} from '../../src/game/engine';

const players = ['p1', 'p2'];
const config = { startingStack: 100, smallBlind: 1, bigBlind: 2 };

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

function totalChips(state: InternalGameState): number {
  return state.pot + state.players.reduce((s, p) => s + p.stack, 0);
}

describe('GameEngine property tests', () => {
  it('conserves chips across actions', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 20 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        const initialTotal = totalChips(engine.getState());
        actions.forEach((a) => engine.applyAction(a));
        const finalTotal = totalChips(engine.getState());
        expect(finalTotal).toBe(initialTotal);
      }),
    );
  });

  it('settlement ledger balances to zero', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 20 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        actions.forEach((a) => engine.applyAction(a));
        while (engine.getState().street !== 'showdown') {
          engine.applyAction({ type: 'next' });
        }
        const settlements = engine.getSettlements();
        const sum = settlements.reduce((s, e) => s + e.delta, 0);
        expect(sum).toBe(0);
      }),
    );
  });

  it('player stacks never go negative', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 20 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        actions.forEach((a) => {
          engine.applyAction(a);
          engine.getState().players.forEach((p) => {
            expect(p.stack).toBeGreaterThanOrEqual(0);
          });
        });
      }),
    );
  });

  it('maintains double-entry and non-negative stacks at each step', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 20 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        const initialTotal = totalChips(engine.getState());
        actions.forEach((a) => {
          engine.applyAction(a);
          const state = engine.getState();
          expect(totalChips(state)).toBe(initialTotal);
          state.players.forEach((p) => {
            expect(p.stack).toBeGreaterThanOrEqual(0);
          });
        });
      }),
    );
  });

  it('pot distribution matches player contributions', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 20 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        const contributions: Record<string, number> = Object.fromEntries(
          players.map((p) => [p, 0]),
        );
        let prev = engine.getState();
        actions.forEach((a) => {
          const next = engine.applyAction(a);
          next.players.forEach((p, idx) => {
            const diff = prev.players[idx].stack - p.stack;
            if (diff > 0) contributions[p.id] += diff;
          });
          prev = next;
        });
        while (engine.getState().street !== 'showdown') {
          const next = engine.applyAction({ type: 'next' });
          next.players.forEach((p, idx) => {
            const diff = prev.players[idx].stack - p.stack;
            if (diff > 0) contributions[p.id] += diff;
          });
          prev = next;
        }
        const totalContribution = Object.values(contributions).reduce(
          (s, v) => s + v,
          0,
        );
        const settlements = engine.getSettlements();
        const distributed = settlements.reduce(
          (s, e) => s + e.delta + contributions[e.playerId],
          0,
        );
        settlements
          .filter((e) => e.delta < 0)
          .forEach((e) => {
            expect(-e.delta).toBe(contributions[e.playerId]);
          });
        expect(distributed).toBe(totalContribution);
      }),
    );
  });
});
