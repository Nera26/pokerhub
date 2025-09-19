import { sanitize } from '../../src/game/state-sanitize';
import type { InternalGameState } from '../../src/game/engine';

describe('state sanitize', () => {
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

  it('hides deck and hole cards from spectators', () => {
    const state = createState();
    const spectator = sanitize(state);
    expect(spectator.serverTime).toEqual(expect.any(Number));
    expect((spectator as any).deck).toBeUndefined();
    for (const p of spectator.players) {
      expect(p.holeCards).toBeUndefined();
    }
  });

  it('reveals hole cards only to the matching player', () => {
    const state = createState();
    const view = sanitize(state, 'p1');
    expect(view.serverTime).toEqual(expect.any(Number));
    const p1 = view.players.find((p) => p.id === 'p1');
    const p2 = view.players.find((p) => p.id === 'p2');
    expect(p1?.holeCards).toEqual([1, 2]);
    expect(p2?.holeCards).toBeUndefined();
    expect((view as any).deck).toBeUndefined();
  });
});
