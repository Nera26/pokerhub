import { GameEngine } from '../../src/game/engine';

describe('GameEngine', () => {
  it('increments tick on each call', () => {
    const engine = new GameEngine();
    const state1 = engine.tick();
    const state2 = engine.tick();
    expect(state1.tick).toBe(1);
    expect(state2.tick).toBe(2);
  });
});
