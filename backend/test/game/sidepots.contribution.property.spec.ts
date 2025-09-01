import fc from 'fast-check';
import {
  HandStateMachine,
  GameStateInternal,
} from '../../src/game/state-machine';
import { HandRNG } from '../../src/game/rng';

describe('side pot contributions', () => {
  it('pot amounts equal summed contributions for multiple all-ins', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 3, maxLength: 5 }).filter((bets) => new Set(bets).size > 1),
        (bets) => {
          const players = bets.map((bet, i) => ({
            id: `P${i}`,
            stack: 0,
            folded: false,
            bet,
            allIn: true,
          }));
          const total = bets.reduce((s, v) => s + v, 0);
          const state: GameStateInternal = {
            phase: 'BETTING_ROUND',
            street: 'preflop',
            pot: total,
            sidePots: [],
            currentBet: Math.max(...bets),
            players,
            deck: [],
            communityCards: [],
          };
          const machine = new HandStateMachine(
            state,
            new HandRNG(),
            { smallBlind: 1, bigBlind: 2 },
          );
          machine.apply({ type: 'next' });
          const pots = state.sidePots;
          const potSum = pots.reduce((s, p) => s + p.amount, 0);
          expect(potSum).toBe(total);
          const perPlayer: Record<string, number> = {};
          for (const pot of pots) {
            const contribSum = Object.values(pot.contributions).reduce((s, v) => s + v, 0);
            expect(contribSum).toBe(pot.amount);
            for (const [id, amt] of Object.entries(pot.contributions)) {
              perPlayer[id] = (perPlayer[id] || 0) + amt;
            }
          }
          bets.forEach((b, idx) => {
            expect(perPlayer[`P${idx}`]).toBe(b);
          });
        },
      ),
    );
  });
});
