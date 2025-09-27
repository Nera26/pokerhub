import { GameEngine, GameAction } from '../../src/game/engine';
import { standardDeck } from '@shared/verify';

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

  it('folding to the last player settles committed chips', async () => {
    const players = ['A', 'B', 'C'];
    const engine = await GameEngine.create(players, config);
    const contributions: Record<string, number> = Object.fromEntries(
      players.map((id) => [id, 0]),
    );
    let previous = structuredClone(engine.getState());

    const apply = (action: GameAction) => {
      const next = engine.applyAction(action);
      next.players.forEach((player, idx) => {
        const diff = previous.players[idx].stack - player.stack;
        if (diff > 0) {
          contributions[player.id] += diff;
        }
      });
      previous = structuredClone(next);
      return next;
    };

    apply({ type: 'postBlind', playerId: 'A', amount: 1 });
    apply({ type: 'postBlind', playerId: 'B', amount: 2 });
    apply({ type: 'postBlind', playerId: 'C', amount: 2 });
    apply({ type: 'next' });

    apply({ type: 'bet', playerId: 'B', amount: 3 });
    apply({ type: 'call', playerId: 'C' });
    apply({ type: 'call', playerId: 'A' });
    apply({ type: 'next' });
    apply({ type: 'next' });

    apply({ type: 'bet', playerId: 'B', amount: 6 });
    apply({ type: 'call', playerId: 'C' });
    apply({ type: 'fold', playerId: 'A' });
    apply({ type: 'next' });
    apply({ type: 'next' });

    apply({ type: 'bet', playerId: 'B', amount: 10 });
    const finalState = apply({ type: 'fold', playerId: 'C' });

    await new Promise((resolve) => setImmediate(resolve));

    expect(finalState.phase).toBe('SETTLE');
    expect(finalState.players.filter((p) => !p.folded)).toHaveLength(1);

    const settlements = engine.getSettlements();
    const totalContribution = Object.values(contributions).reduce(
      (sum, value) => sum + value,
      0,
    );
    const distributed = settlements.reduce(
      (sum, entry) => sum + entry.delta + contributions[entry.playerId],
      0,
    );
    const state = engine.getState();
    const remainingPot =
      state.sidePots.length > 0
        ? state.sidePots.reduce((sum, pot) => sum + pot.amount, 0)
        : state.pot;

    settlements
      .filter((entry) => entry.delta < 0)
      .forEach((entry) => {
        expect(-entry.delta).toBe(contributions[entry.playerId]);
      });

    expect(distributed + remainingPot).toBe(totalContribution);
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

  it('rebuilds the shoe when depleted between streets', async () => {
    const engine = await GameEngine.create(['A', 'B'], config);
    engine.applyAction({ type: 'postBlind', playerId: 'A', amount: 1 });
    engine.applyAction({ type: 'postBlind', playerId: 'B', amount: 2 });

    // Preflop betting round
    engine.applyAction({ type: 'next' });
    engine.applyAction({ type: 'call', playerId: 'A' });
    engine.applyAction({ type: 'next' });

    const state = engine.getState();
    state.deck.length = 0;

    expect(() => engine.applyAction({ type: 'next' })).not.toThrow();
    expect(engine.getState().communityCards.length).toBe(3);

    engine.getState().deck.length = 0;
    engine.applyAction({ type: 'next' });
    expect(() => engine.applyAction({ type: 'next' })).not.toThrow();
    expect(engine.getState().communityCards.length).toBe(4);

    engine.getState().deck.length = 0;
    engine.applyAction({ type: 'next' });
    expect(() => engine.applyAction({ type: 'next' })).not.toThrow();

    const finalState = engine.getState();
    expect(finalState.communityCards.length).toBe(5);
    for (const player of finalState.players) {
      expect(player.holeCards?.length).toBe(2);
    }

    const totalHoleCards = finalState.players.reduce(
      (sum, player) => sum + (player.holeCards?.length ?? 0),
      0,
    );
    const deckSize = standardDeck().length;
    expect(finalState.deck.length).toBe(
      deckSize - totalHoleCards - finalState.communityCards.length,
    );

    expect(() => engine.applyAction({ type: 'next' })).not.toThrow();
    expect(engine.getState().phase).toBe('SETTLE');
    expect(engine.getState().street).toBe('showdown');
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
