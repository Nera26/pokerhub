import fc from 'fast-check';
import {
  GameEngine,
  GameAction,
  InternalGameState,
} from '../../src/game/engine';
import { standardDeck } from '@shared/verify';

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

function withMandatoryBlinds(actions: GameAction[]): GameAction[] {
  const blindActions = players.map<GameAction>((playerId, index) => ({
    type: 'postBlind',
    playerId,
    amount: index === 0 ? config.smallBlind : config.bigBlind,
  }));

  return [...blindActions, ...actions];
}

function shouldSkipNext(state: InternalGameState): boolean {
  if (state.phase !== 'BETTING_ROUND') return false;

  return state.players.some(
    (p) => !p.folded && !p.allIn && p.bet < state.currentBet,
  );
}

function applyActionSafely(
  engine: GameEngine,
  action: GameAction,
): InternalGameState | null {
  const state = engine.getState();
  if (action.type === 'next' && shouldSkipNext(state)) {
    return null;
  }

  try {
    return engine.applyAction(action);
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
    return null;
  }
}

function playSequence(
  engine: GameEngine,
  actions: GameAction[],
  onApplied?: (prev: InternalGameState, next: InternalGameState) => void,
): void {
  for (const action of withMandatoryBlinds(actions)) {
    const prevState = onApplied
      ? structuredClone(engine.getState())
      : undefined;
    const nextState = applyActionSafely(engine, action);
    if (nextState && onApplied && prevState) {
      onApplied(prevState, nextState);
    }
  }
}

describe('GameEngine property tests', () => {
  it('conserves chips across actions', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 20 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        const initialTotal = totalChips(engine.getState());
        playSequence(engine, actions);
        const finalTotal = totalChips(engine.getState());
        expect(finalTotal).toBe(initialTotal);
      }),
    );
  });

  it('settlement ledger balances to zero', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(actionArb, { maxLength: 20 }), async (actions) => {
        const engine = await GameEngine.create(players, config);
        playSequence(engine, actions);
        let guard = 0;
        while (engine.getState().street !== 'showdown' && guard < 10) {
          const nextState = applyActionSafely(engine, { type: 'next' });
          if (!nextState) break;
          guard++;
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
        playSequence(engine, actions, (_, state) => {
          state.players.forEach((p) => {
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
        playSequence(engine, actions, (_, state) => {
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
        let prev = structuredClone(engine.getState());
        playSequence(engine, actions, (previous, next) => {
          next.players.forEach((p, idx) => {
            const diff = previous.players[idx].stack - p.stack;
            if (diff > 0) contributions[p.id] += diff;
          });
          prev = next;
        });
        let guard = 0;
        while (engine.getState().street !== 'showdown' && guard < 10) {
          const next = applyActionSafely(engine, { type: 'next' });
          if (!next) break;
          next.players.forEach((p, idx) => {
            const diff = prev.players[idx].stack - p.stack;
            if (diff > 0) contributions[p.id] += diff;
          });
          prev = next;
          guard++;
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
        const state = engine.getState();
        const remainingPot =
          state.sidePots.length > 0
            ? state.sidePots.reduce((sum, pot) => sum + pot.amount, 0)
            : state.pot;
        settlements
          .filter((e) => e.delta < 0)
          .forEach((e) => {
            expect(-e.delta).toBe(contributions[e.playerId]);
          });
        expect(distributed + remainingPot).toBe(totalContribution);
      }),
    );
  });

  it('completes a full hand without exhausting the deck', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.integer({ min: 0, max: 52 }),
          fc.integer({ min: 0, max: 52 }),
          fc.integer({ min: 0, max: 52 }),
        ),
        async ([burnFlop, burnTurn, burnRiver]) => {
          const engine = await GameEngine.create(players, config);
          engine.applyAction({
            type: 'postBlind',
            playerId: players[0],
            amount: config.smallBlind,
          });
          engine.applyAction({
            type: 'postBlind',
            playerId: players[1],
            amount: config.bigBlind,
          });

          engine.applyAction({ type: 'next' });
          engine.applyAction({ type: 'call', playerId: players[0] });
          engine.applyAction({ type: 'next' });

          const deck = engine.getState().deck;
          deck.length = Math.max(deck.length - burnFlop, 0);
          engine.applyAction({ type: 'next' });

          engine.applyAction({ type: 'next' });
          const turnDeck = engine.getState().deck;
          turnDeck.length = Math.max(turnDeck.length - burnTurn, 0);
          engine.applyAction({ type: 'next' });

          engine.applyAction({ type: 'next' });
          const riverDeck = engine.getState().deck;
          riverDeck.length = Math.max(riverDeck.length - burnRiver, 0);
          engine.applyAction({ type: 'next' });

          engine.applyAction({ type: 'next' });

          const finalState = engine.getState();
          expect(finalState.communityCards.length).toBe(5);
          finalState.players.forEach((p) => {
            expect(p.holeCards?.length).toBe(2);
          });

          const holeCardCount = finalState.players.reduce(
            (sum, player) => sum + (player.holeCards?.length ?? 0),
            0,
          );
          const deckSize = standardDeck().length;
          expect(finalState.deck.length).toBe(
            deckSize - holeCardCount - finalState.communityCards.length,
          );
        },
      ),
    );
  });
});
