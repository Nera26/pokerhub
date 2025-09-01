import fc from 'fast-check';
import {
  GameEngine,
  GameAction,
  InternalGameState,
} from '../../src/game/engine';

const players = ['p1', 'p2', 'p3'];
const config = { startingStack: 20, smallBlind: 1, bigBlind: 2 };

const actionArb: fc.Arbitrary<GameAction> = fc.oneof(
  fc.record({
    type: fc.constant('bet'),
    playerId: fc.constantFrom(...players),
    amount: fc.integer({ min: 1, max: 5 }),
  }),
  fc.record({
    type: fc.constant('call'),
    playerId: fc.constantFrom(...players),
  }),
  fc.record({ type: fc.constant('next') }),
);

function totalChips(state: InternalGameState): number {
  return state.pot + state.players.reduce((s, p) => s + p.stack, 0);
}

describe('random betting invariants', () => {
  it('maintains pot and settlement invariants', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 30 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        // Ensure betting round is active
        for (const id of players) {
          engine.applyAction({ type: 'postBlind', playerId: id, amount: 1 });
        }
        engine.applyAction({ type: 'next' });

        const initialTotal = totalChips(engine.getState());

        actions.forEach((a) => {
          try {
            engine.applyAction(a);
          } catch {
            /* ignore invalid actions */
          }
        });

        // close current betting round to compute side pots
        if (engine.getState().phase === 'BETTING_ROUND') {
          engine.applyAction({ type: 'next' });
        }
        const beforeSettle = engine.getState();
        if (beforeSettle.phase !== 'SETTLE') {
          const sidePotSum = beforeSettle.sidePots.reduce(
            (s, p) => s + p.amount,
            0,
          );
          expect(sidePotSum).toBe(beforeSettle.pot);
        }

        // advance game to settlement
        let guard = 0;
        while (engine.getState().phase !== 'SETTLE' && guard < 10) {
          engine.applyAction({ type: 'next' });
          guard++;
        }

        const finalState = engine.getState();
        expect(totalChips(finalState)).toBe(initialTotal);

        const deltaSum = engine.getSettlements().reduce((s, e) => s + e.delta, 0);
        expect(deltaSum).toBe(0);
      }),
    );
  });
});

