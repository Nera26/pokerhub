import { GameEngine, GameAction } from '../../src/game/engine';

const config = { startingStack: 100, smallBlind: 1, bigBlind: 2 };

describe('Hand state machine', () => {
  it('replays hand deterministically', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
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
    for (const s of [finalState, replayed]) {
      delete (s as any).deck;
      s.communityCards = [];
      for (const p of s.players as any[]) {
        delete p.holeCards;
      }
    }
    expect(replayed).toEqual(finalState);
  });

  it('records settlement totals', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
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

  it('advances from blinds to betting', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    const state = engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });
    expect(state.phase).toBe('DEAL');
    const betting = engine.applyAction({ type: 'next' });
    expect(betting.phase).toBe('BETTING_ROUND');
    expect(betting.pot).toBe(3);
  });

  it('deals hole and community cards', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });
    engine.applyAction({ type: 'next' });
    let state = engine.getState();
    for (const p of state.players) {
      expect(p.holeCards?.length).toBe(2);
    }
    expect(state.deck.length).toBe(52 - 4);

    engine.applyAction({ type: 'next' });
    state = engine.applyAction({ type: 'next' });
    expect(state.communityCards.length).toBe(3);
    expect(state.deck.length).toBe(52 - 4 - 3);
  });

  it('handles multi-street betting', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
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

  it('settles at showdown', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
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
    const total = settlements.reduce((sum, s) => sum + s.delta, 0);
    expect(total).toBe(0);
    const pot = -settlements
      .filter((s) => s.delta < 0)
      .reduce((sum, s) => sum + s.delta, 0);
    const winnerDelta = Math.max(...settlements.map((s) => s.delta));
    expect(winnerDelta).toBe(pot);
  });

  it('rejects invalid bet amounts', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });
    engine.applyAction({ type: 'next' });
    expect(() =>
      engine.applyAction({ type: 'bet', playerId: 'A', amount: 0 }),
    ).toThrow();
    expect(() =>
      engine.applyAction({ type: 'bet', playerId: 'A', amount: 1000 }),
    ).toThrow();
  });
});
