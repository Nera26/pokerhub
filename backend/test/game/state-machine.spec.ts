import { GameEngine, GameAction } from '../../src/game/engine';

describe('Hand state machine', () => {
  it('replays hand deterministically', () => {
    const engine = new GameEngine(['A', 'B']);
    const actions: GameAction[] = [
      { type: 'bet', playerId: 'A', amount: 10 },
      { type: 'call', playerId: 'B', amount: 10 },
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
    engine.applyAction({ type: 'bet', playerId: 'A', amount: 10 });
    engine.applyAction({ type: 'call', playerId: 'B', amount: 10 });
    engine.applyAction({ type: 'fold', playerId: 'B' });
    const settlements = engine.getSettlements();
    expect(settlements).toContainEqual({ playerId: 'A', delta: 10 });
    expect(settlements).toContainEqual({ playerId: 'B', delta: -10 });
  });
});
