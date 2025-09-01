import fc from 'fast-check';
import { HandStateMachine, GameAction, GameStateInternal, PlayerStateInternal } from './state-machine';
import { HandRNG } from './rng';
import { settlePots, recordDeltas, SettlementJournal } from './settlement';

describe('pot invariants', () => {
  it('keeps stacks non-negative and balances settlements', () => {
    const players = ['A', 'B'];
    const config = { smallBlind: 1, bigBlind: 2, startingStack: 20 };

    const actionArb: fc.Arbitrary<GameAction> = fc.oneof(
      fc.record({
        type: fc.constant('bet'),
        playerId: fc.constantFrom(...players),
        amount: fc.integer({ min: 1, max: 5 }),
      }),
      fc.record({
        type: fc.constant('raise'),
        playerId: fc.constantFrom(...players),
        amount: fc.integer({ min: 1, max: 5 }),
      }),
      fc.record({
        type: fc.constant('call'),
        playerId: fc.constantFrom(...players),
      }),
      fc.record({ type: fc.constant('check'), playerId: fc.constantFrom(...players) }),
      fc.record({ type: fc.constant('fold'), playerId: fc.constantFrom(...players) }),
    );

    fc.assert(
      fc.property(fc.array(actionArb, { maxLength: 30 }), (actions) => {
        const initialPlayers: PlayerStateInternal[] = players.map((id) => ({
          id,
          stack: config.startingStack,
          folded: false,
          bet: 0,
          allIn: false,
        }));
        const state: GameStateInternal = {
          phase: 'WAIT_BLINDS',
          street: 'preflop',
          pot: 0,
          sidePots: [],
          currentBet: 0,
          players: initialPlayers,
          deck: [],
          communityCards: [],
        };
        const machine = new HandStateMachine(state, new HandRNG(), {
          smallBlind: config.smallBlind,
          bigBlind: config.bigBlind,
        });
        const initialStacks = new Map(initialPlayers.map((p) => [p.id, p.stack]));

        // post mandatory blinds and advance to betting round
        machine.apply({ type: 'postBlind', playerId: players[0], amount: config.smallBlind });
        machine.apply({ type: 'postBlind', playerId: players[1], amount: config.bigBlind });
        machine.apply({ type: 'next' });

        for (const action of actions) {
          try {
            machine.apply(action);
          } catch {
            /* ignore invalid actions */
          }
          const st = machine.getState();
          if (machine.activePlayers().length <= 1 && st.phase === 'BETTING_ROUND') {
            st.phase = 'SHOWDOWN';
            break;
          }
          if (st.phase === 'SHOWDOWN') break;
        }

        // progress to showdown if still mid-hand
        let guard = 0;
        while (machine.getState().phase !== 'SHOWDOWN' && guard < 10) {
          try {
            machine.apply({ type: 'next' });
          } catch {
            break;
          }
          guard++;
        }

        const before = machine.getState();
        settlePots(before);
        const journal = new SettlementJournal();
        const entries = recordDeltas(before, initialStacks, journal);

        expect(before.players.every((p) => p.stack >= 0)).toBe(true);

        const gains = entries
          .filter((e) => e.delta > 0)
          .reduce((s, e) => s + e.delta, 0);
        const losses = entries
          .filter((e) => e.delta < 0)
          .reduce((s, e) => s - e.delta, 0);
        expect(gains).toBe(losses);
      }),
      { seed: 42 },
    );
  });
});

