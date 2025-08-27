import { HandLog } from '../hand-log';
import { HandStateMachine, GameAction, GameState } from '../state-machine';
import { SettlementJournal, SettlementEntry } from '../settlement';
import { WalletService } from '../../wallet/wallet.service';

/**
 * GameEngine orchestrates the poker hand state machine, keeping
 * track of per-action logs and settlement results.
 */
export class GameEngine {
  private readonly log = new HandLog();
  private readonly settlement = new SettlementJournal();
  private readonly initialStacks: Map<string, number>; // for delta calc
  private readonly machine: HandStateMachine;

  constructor(
    playerIds: string[] = ['p1', 'p2'],
    private readonly wallet: WalletService,
  ) {
    const players = playerIds.map((id) => ({
      id,
      stack: 100,
      bet: 0,
      folded: false,
      allIn: false,
    }));
    this.initialStacks = new Map(players.map((p) => [p.id, p.stack]));
    this.machine = new HandStateMachine({
      street: 'preflop',
      pot: 0,
      sidePots: [],
      dealer: 0,
      currentBet: 0,
      players,
    });
  }

  async applyAction(action: GameAction): Promise<GameState> {
    const before = this.machine.getState().players.map((p) => ({
      id: p.id,
      stack: p.stack,
    }));

    const state = this.machine.apply(action);
    this.log.record(action);

    // Reserve any chips that left a stack
    const after = this.machine.getState().players;
    for (const b of before) {
      const a = after.find((p) => p.id === b.id)!;
      const diff = b.stack - a.stack;
      if (diff > 0) {
        await this.wallet.reserve(b.id, diff);
      }
    }

    // If only one player remains, settle immediately
    if (this.machine.activePlayers().length <= 1 && state.street !== 'showdown') {
      state.street = 'showdown';
    }

    if (state.street === 'showdown') {
      await this.settle();
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

  async replayHand(): Promise<GameState> {
    const replay = new GameEngine(
      this.machine.getState().players.map((p) => p.id),
      this.wallet,
    );
    for (const action of this.getHandLog()) {
      await replay.applyAction(action);
    }
    return replay.getState();
  }

  private async settle() {
    const state = this.machine.getState();
    const winners = state.players.filter((p) => !p.folded);
    if (winners.length === 0) return;

    const share = Math.floor(state.pot / winners.length);
    winners.forEach((p) => (p.stack += share));
    const remainder = state.pot - share * winners.length;
    if (remainder > 0) winners[0].stack += remainder;
    state.pot = 0;

    const settlements: SettlementEntry[] = [];
    for (const player of state.players) {
      const initial = this.initialStacks.get(player.id) ?? 0;
      const delta = player.stack - initial;
      const entry = { playerId: player.id, delta };
      this.settlement.record(entry);
      settlements.push(entry);
    }

    await this.wallet.settleHand(settlements);
  }
}

export type { GameAction, GameState } from '../state-machine';
