import { HandLog } from '../hand-log';
import { HandStateMachine, GameAction, GameState } from '../state-machine';
import { SettlementJournal } from '../settlement';

/**
 * GameEngine orchestrates the poker hand state machine, keeping
 * track of per-action logs and settlement results.
 */
export class GameEngine {
  private readonly log = new HandLog();
  private readonly settlement = new SettlementJournal();
  private readonly initialStacks: Map<string, number>; // for delta calc
  private readonly machine: HandStateMachine;

  constructor(playerIds: string[] = ['p1', 'p2']) {
    const players = playerIds.map((id) => ({ id, stack: 100, folded: false }));
    this.initialStacks = new Map(players.map((p) => [p.id, p.stack]));
    this.machine = new HandStateMachine({ street: 'preflop', pot: 0, players });
  }

  applyAction(action: GameAction): GameState {
    const state = this.machine.apply(action);
    this.log.record(action);

    // If only one player remains, settle immediately
    if (this.machine.activePlayers().length <= 1 && state.street !== 'showdown') {
      state.street = 'showdown';
    }

    if (state.street === 'showdown') {
      this.settle();
    }

    return state;
  }

  getState(): GameState {
    return this.machine.getState();
  }

  getHandLog() {
    return this.log.getAll();
  }

  getSettlements() {
    return this.settlement.getAll();
  }

  replayHand(): GameState {
    const replay = new GameEngine(this.machine.getState().players.map((p) => p.id));
    for (const action of this.getHandLog()) {
      replay.applyAction(action);
    }
    return replay.getState();
  }

  private settle() {
    const state = this.machine.getState();
    const winners = state.players.filter((p) => !p.folded);
    if (winners.length === 0) return;

    const share = Math.floor(state.pot / winners.length);
    winners.forEach((p) => (p.stack += share));
    const remainder = state.pot - share * winners.length;
    if (remainder > 0) winners[0].stack += remainder;
    state.pot = 0;

    for (const player of state.players) {
      const initial = this.initialStacks.get(player.id) ?? 0;
      const delta = player.stack - initial;
      this.settlement.record({ playerId: player.id, delta });
    }
  }
}

export type { GameAction, GameState } from '../state-machine';
