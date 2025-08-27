import { GameEngine, GameAction } from '../../src/game/engine';
import { WalletService } from '../../src/wallet/wallet.service';

const walletStub: WalletService = {
  reserve: async () => {},
  commit: async () => {},
  rollback: async () => {},
  settleHand: async () => {},
} as any;

describe('Hand state machine', () => {
  it('replays hand deterministically', async () => {
    const engine = new GameEngine(['A', 'B'], walletStub);
    const actions: GameAction[] = [
      { type: 'bet', playerId: 'A', amount: 10 },
      { type: 'call', playerId: 'B' },
      { type: 'next' },
      { type: 'next' },
      { type: 'next' },
      { type: 'next' },
    ];
    for (const a of actions) await engine.applyAction(a);

    const finalState = engine.getState();
    const replayed = await engine.replayHand();
    expect(replayed).toEqual(finalState);
  });

  it('records settlement totals', async () => {
    const engine = new GameEngine(['A', 'B'], walletStub);
    await engine.applyAction({ type: 'bet', playerId: 'A', amount: 10 });
    await engine.applyAction({ type: 'call', playerId: 'B' });
    await engine.applyAction({ type: 'fold', playerId: 'B' });
    const settlements = engine.getSettlements();
    expect(settlements).toContainEqual({ playerId: 'A', delta: 12 });
    expect(settlements).toContainEqual({ playerId: 'B', delta: -12 });
  });
});
