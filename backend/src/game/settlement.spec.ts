import { settlePots, recordDeltas, SettlementJournal } from './settlement';
import type { GameStateInternal, PlayerStateInternal } from './state-machine';

describe('settlePots', () => {
  it('distributes side pots and records deltas', () => {
    const players: PlayerStateInternal[] = [
      { id: 'A', stack: 0, folded: false, bet: 0, allIn: true, holeCards: [48, 49] }, // AA
      { id: 'B', stack: 0, folded: false, bet: 0, allIn: true, holeCards: [44, 45] }, // KK
      { id: 'C', stack: 0, folded: false, bet: 0, allIn: true, holeCards: [40, 41] }, // QQ
    ];

    const state: GameStateInternal = {
      phase: 'SHOWDOWN',
      street: 'showdown',
      pot: 50,
      sidePots: [
        { amount: 30, players: ['A', 'B', 'C'], contributions: { A: 10, B: 10, C: 10 } },
        { amount: 20, players: ['B', 'C'], contributions: { B: 10, C: 10 } },
      ],
      currentBet: 0,
      players,
      deck: [],
      communityCards: [0, 5, 20, 26, 31], // random board, no improvement
    };

    settlePots(state);

    expect(players.map((p) => p.stack)).toEqual([30, 20, 0]);

    const journal = new SettlementJournal();
    const initial = new Map(players.map((p) => [p.id, 0]));
    recordDeltas(state, initial, journal);

    expect(journal.getAll()).toEqual([
      { playerId: 'A', delta: 30 },
      { playerId: 'B', delta: 20 },
      { playerId: 'C', delta: 0 },
    ]);
  });
});
