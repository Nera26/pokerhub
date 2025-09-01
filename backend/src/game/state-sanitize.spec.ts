import { sanitize } from './state-sanitize';
import type { InternalGameState } from './engine';

describe('sanitize', () => {
  function createState(): InternalGameState {
    return {
      phase: 'BETTING_ROUND',
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      deck: [1, 2, 3, 4, 5],
      communityCards: [],
      players: [
        {
          id: 'p1',
          stack: 100,
          folded: false,
          bet: 0,
          allIn: false,
          holeCards: [1, 2],
        },
        {
          id: 'p2',
          stack: 100,
          folded: false,
          bet: 0,
          allIn: false,
          holeCards: [3, 4],
        },
      ],
    };
  }

  it('strips hole cards from non-owners', () => {
    const state = createState();
    const view = sanitize(state, 'p1');
    const p1 = view.players.find((p) => p.id === 'p1');
    const p2 = view.players.find((p) => p.id === 'p2');
    expect(p1?.holeCards).toEqual([1, 2]);
    expect(p2?.holeCards).toBeUndefined();
  });

  it('hides all hole cards from spectators', () => {
    const state = createState();
    const spectator = sanitize(state);
    for (const player of spectator.players) {
      expect(player.holeCards).toBeUndefined();
    }
  });
});
