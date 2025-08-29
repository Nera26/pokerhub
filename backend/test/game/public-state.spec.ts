import { GameEngine } from '../../src/game/engine';

describe('GameEngine.getPublicState', () => {
  it('omits hole cards for each player', async () => {
    const engine = await GameEngine.create(['a', 'b']);
    const state = engine.getState();
    (state.players[0] as any).holeCards = ['As', 'Kd'];
    (state.players[1] as any).cards = ['Qc', 'Jh'];

    const publicState = engine.getPublicState();
    for (const player of publicState.players as Array<Record<string, unknown>>) {
      expect(player.holeCards).toBeUndefined();
      expect(player.cards).toBeUndefined();
    }
  });
});

