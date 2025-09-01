import { HandStateMachine, GameStateInternal, HandPhase } from '../../src/game/state-machine';
import { HandRNG } from '../../src/game/rng';

describe('HandStateMachine invalid actions', () => {
  const config = { smallBlind: 1, bigBlind: 2 };

  function createMachine(phase: HandPhase): HandStateMachine {
    const state: GameStateInternal = {
      phase,
      street: phase === 'SHOWDOWN' ? 'showdown' : 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: [
        { id: 'A', stack: 100, folded: false, bet: 0, allIn: false },
        { id: 'B', stack: 100, folded: false, bet: 0, allIn: false },
      ],
      deck: [],
      communityCards: [],
    };
    return new HandStateMachine(state, new HandRNG(), config);
  }

  it('throws for invalid actions in WAIT_BLINDS', () => {
    const machine = createMachine('WAIT_BLINDS');
    expect(() => machine.apply({ type: 'next' })).toThrow('invalid action for phase');
  });

  it('throws for invalid actions in DEAL', () => {
    const machine = createMachine('DEAL');
    expect(() =>
      machine.apply({ type: 'bet', playerId: 'A', amount: 1 }),
    ).toThrow('invalid action for phase');
  });

  it('throws for invalid actions in BETTING_ROUND', () => {
    const machine = createMachine('BETTING_ROUND');
    expect(() => machine.apply({ type: 'bogus' } as any)).toThrow(
      'invalid action for phase',
    );
  });

  it('throws for invalid actions in SHOWDOWN', () => {
    const machine = createMachine('SHOWDOWN');
    expect(() =>
      machine.apply({ type: 'bet', playerId: 'A', amount: 1 }),
    ).toThrow('invalid action for phase');
  });

  it('throws for invalid actions in SETTLE', () => {
    const machine = createMachine('SETTLE');
    expect(() => machine.apply({ type: 'next' })).toThrow(
      'invalid action for phase',
    );
  });
});
