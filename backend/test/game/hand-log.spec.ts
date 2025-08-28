import { HandLog } from '../../src/game/hand-log';
import { GameAction, GameState } from '../../src/game/state-machine';

describe('HandLog', () => {
  it('reconstructs state by action index', () => {
    const log = new HandLog();

    const basePlayers = [
      { id: 'A', stack: 100, folded: false, bet: 0, allIn: false },
      { id: 'B', stack: 100, folded: false, bet: 0, allIn: false },
    ];

    const s0: GameState = {
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: structuredClone(basePlayers),
    };

    const a1: GameAction = { type: 'bet', playerId: 'A', amount: 5 };
    const s1: GameState = structuredClone(s0);
    s1.players[0].stack -= 5;
    s1.players[0].bet = 5;
    s1.pot = 5;
    s1.currentBet = 5;

    const a2: GameAction = { type: 'call', playerId: 'B', amount: 5 };
    const s2: GameState = structuredClone(s1);
    s2.players[1].stack -= 5;
    s2.players[1].bet = 5;
    s2.pot = 10;

    log.record(a1, s0, s1);
    log.record(a2, s1, s2);

    expect(log.reconstruct(0)).toEqual(s1);
    expect(log.reconstruct(1)).toEqual(s2);
  });
});
