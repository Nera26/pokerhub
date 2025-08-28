import fc from 'fast-check';
import { GameEngine, GameAction, GameState } from '../../src/game/engine';

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

function totalChips(state: GameState): number {
  return state.pot + state.players.reduce((s, p) => s + p.stack, 0);
}

describe('GameEngine property tests', () => {
  it('conserves chips across actions', () => {
    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 20 }), (actions) => {
        const engine = new GameEngine(players);
        const initialTotal = totalChips(engine.getState());
        actions.forEach((a) => engine.applyAction(a));
        const finalTotal = totalChips(engine.getState());
        expect(finalTotal).toBe(initialTotal);
      }),
    );
  });

  it('settlement ledger balances to zero', () => {
    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 20 }), (actions) => {
        const engine = new GameEngine(players);
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

  it('player stacks never go negative', () => {
    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 20 }), (actions) => {
        const engine = new GameEngine(players);
        actions.forEach((a) => {
          engine.applyAction(a);
          engine.getState().players.forEach((p) => {
            expect(p.stack).toBeGreaterThanOrEqual(0);
          });
        });
      }),
    );
  });

  it('maintains double-entry and non-negative stacks at each step', () => {
    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 20 }), (actions) => {
        const engine = new GameEngine(players);
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
});
