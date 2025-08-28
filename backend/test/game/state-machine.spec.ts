import { GameEngine, GameAction } from '../../src/game/engine';

describe('Hand state machine', () => {
  it('replays hand deterministically', () => {
    const engine = new GameEngine(['A', 'B']);
    const actions: GameAction[] = [
      { type: 'postBlind', playerId: 'A', amount: 1 },
      { type: 'postBlind', playerId: 'B', amount: 2 },
      { type: 'next' },
      { type: 'bet', playerId: 'A', amount: 10 },
      { type: 'call', playerId: 'B' },
      { type: 'next' },
      { type: 'next' },
      { type: 'next' },
      { type: 'next' },
      { type: 'next' },
    ];
    actions.forEach((a) => engine.applyAction(a));

    const finalState = engine.getState();
    const replayed = engine.replayHand();
    expect(replayed).toEqual(finalState);
  });

  it('records settlement totals', () => {
    const engine = new GameEngine(['A', 'B']);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'bet', playerId: 'A', amount: 10 });
    engine.applyAction({ type: 'call', playerId: 'B' });
    engine.applyAction({ type: 'fold', playerId: 'B' });
    const settlements = engine.getSettlements();
    expect(settlements).toContainEqual({ playerId: 'A', delta: 11 });
    expect(settlements).toContainEqual({ playerId: 'B', delta: -11 });
  });

  it('advances from blinds to betting', () => {
    const engine = new GameEngine(['A', 'B']);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    const state = engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });
    expect(state.phase).toBe('DEAL');
    const betting = engine.applyAction({ type: 'next' });
    expect(betting.phase).toBe('BETTING_ROUND');
    expect(betting.pot).toBe(3);
  });

  it('handles multi-street betting', () => {
    const engine = new GameEngine(['A', 'B']);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'bet', playerId: 'A', amount: 5 });
    engine.applyAction({ type: 'call', playerId: 'B' });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    let state = engine.getState();
    expect(state.street).toBe('flop');
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    state = engine.getState();
    expect(state.street).toBe('turn');
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    state = engine.getState();
    expect(state.street).toBe('river');
  });

  it('settles at showdown', () => {
    const engine = new GameEngine(['A', 'B']);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'bet', playerId: 'A', amount: 10 });
    engine.applyAction({ type: 'call', playerId: 'B' });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'next' });
    const final = engine.applyAction({ type: 'next' });
    expect(final.phase).toBe('SETTLE');
    expect(final.pot).toBe(0);
    const settlements = engine.getSettlements();
    expect(settlements).toContainEqual({ playerId: 'A', delta: 0 });
    expect(settlements).toContainEqual({ playerId: 'B', delta: 0 });
  });
});
