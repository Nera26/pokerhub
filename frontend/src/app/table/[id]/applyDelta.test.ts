import { applyDelta } from './page';
import type { GameState } from '@shared/types';

describe('applyDelta', () => {
  const baseState: GameState = {
    version: '1',
    tick: 1,
    phase: 'DEAL',
    street: 'preflop',
    pot: 0,
    sidePots: [],
    currentBet: 0,
    players: [
      { id: 'a', stack: 100, folded: false, bet: 0, allIn: false },
    ],
    communityCards: [],
  };

  it('merges scalar fields', () => {
    const result = applyDelta(baseState, { pot: 50, tick: 2 });
    expect(result.pot).toBe(50);
    expect(result.tick).toBe(2);
    expect(result.players).toEqual(baseState.players);
  });

  it('replaces arrays', () => {
    const result = applyDelta(baseState, {
      players: [
        { id: 'a', stack: 90, folded: false, bet: 10, allIn: false },
      ],
    });
    expect(result.players[0].stack).toBe(90);
    expect(baseState.players[0].stack).toBe(100);
  });

  it('initializes state when target is null', () => {
    const result = applyDelta(null, baseState);
    expect(result).toEqual(baseState);
  });
});

