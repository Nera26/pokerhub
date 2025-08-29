import { GameEngine } from '../../src/game/engine';

function card(rank: number, suit: number) {
  return rank * 4 + suit;
}

describe('settlement', () => {
  it('distributes side pots correctly', async () => {
    const engine = (await GameEngine.create(['A', 'B', 'C'])) as any;
    // Adjust initial stacks for scenario
    engine.initialStacks = new Map([
      ['A', 100],
      ['B', 100],
      ['C', 50],
    ]);
    const state: any = engine.getState();
    state.board = [card(0, 0), card(7, 1), card(2, 2), card(6, 3), card(11, 3)];
    state.players[0].cards = [card(1, 0), card(3, 1)]; // A
    state.players[1].cards = [card(11, 1), card(5, 2)]; // B
    state.players[2].cards = [card(12, 3), card(12, 2)]; // C
    state.sidePots = [
      {
        amount: 150,
        players: ['A', 'B', 'C'],
        contributions: { A: 50, B: 50, C: 50 },
      },
      {
        amount: 100,
        players: ['A', 'B'],
        contributions: { A: 50, B: 50 },
      },
    ];
    state.pot = 250;
    state.players.forEach((p: any) => (p.stack = 0));
    await engine['settle']();
    const a = state.players.find((p: any) => p.id === 'A').stack;
    const b = state.players.find((p: any) => p.id === 'B').stack;
    const c = state.players.find((p: any) => p.id === 'C').stack;
    expect(a).toBe(0);
    expect(b).toBe(100);
    expect(c).toBe(150);
  });

  it('splits pots on ties', async () => {
    const engine = await GameEngine.create(['A', 'B']);
    const state: any = engine.getState();
    state.board = [card(0, 0), card(7, 1), card(2, 2), card(6, 3), card(11, 3)];
    state.players[0].cards = [card(12, 2), card(10, 0)];
    state.players[1].cards = [card(12, 1), card(10, 1)];
    state.sidePots = [
      {
        amount: 100,
        players: ['A', 'B'],
        contributions: { A: 50, B: 50 },
      },
    ];
    state.pot = 100;
    state.players.forEach((p: any) => (p.stack = 0));
    await (engine as any)['settle']();
    const a = state.players.find((p: any) => p.id === 'A').stack;
    const b = state.players.find((p: any) => p.id === 'B').stack;
    expect(a).toBe(50);
    expect(b).toBe(50);
  });
});
