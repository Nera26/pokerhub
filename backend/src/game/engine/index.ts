import { HandLog, HandLogEntry } from '../hand-log';
import { HandStateMachine, GameAction, GameState } from '../state-machine';
import { SettlementJournal } from '../settlement';
import { WalletService } from '../../wallet/wallet.service';
import { randomUUID } from 'crypto';
import { HandRNG } from '../rng';
import { Repository } from 'typeorm';
import { Hand } from '../../database/entities/hand.entity';
import { EventPublisher } from '../../events/events.service';

/**
 * GameEngine orchestrates the poker hand state machine, keeping
 * track of per-action logs and settlement results.
 */
export class GameEngine {
  private readonly log = new HandLog();
  private readonly settlement = new SettlementJournal();
  private readonly initialStacks: Map<string, number>; // for delta calc
  private readonly machine: HandStateMachine;
  private readonly handId = randomUUID();
  private readonly rng = new HandRNG();

  constructor(
    playerIds: string[] = ['p1', 'p2'],
    private readonly wallet?: WalletService,
    private readonly handRepo?: Repository<Hand>,
    private readonly events?: EventPublisher,
  ) {
    const players = playerIds.map((id) => ({
      id,
      stack: 100,
      folded: false,
      bet: 0,
      allIn: false,
    }));
    this.initialStacks = new Map(players.map((p) => [p.id, p.stack]));
    this.machine = new HandStateMachine({
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players,
    });
    if (this.wallet) {
      void this.reserveStacks();
    }
    this.events?.emit('hand.start', {
      handId: this.handId,
      players: playerIds,
    });
  }

  private async reserveStacks() {
    const state = this.machine.getState();
    for (const player of state.players) {
      await this.wallet!.reserve(player.id, player.stack, this.handId);
    }
  }

  getHandId() {
    return this.handId;
  }

  applyAction(action: GameAction): GameState {
    const preState = structuredClone(this.machine.getState());
    const state = this.machine.apply(action);

    // If only one player remains, settle immediately
    if (
      this.machine.activePlayers().length <= 1 &&
      state.street !== 'showdown'
    ) {
      state.street = 'showdown';
    }

    const postState = structuredClone(this.machine.getState());
    this.log.record(action, preState, postState);

    if (state.street === 'showdown') {
      void this.settle();
    }

    return state;
  }

  getState(): GameState {
    return this.machine.getState();
  }

  getPublicState(): GameState {
    const state = structuredClone(this.machine.getState());
    for (const player of state.players as Array<Record<string, unknown>>) {
      delete player.cards;
      delete (player as any).holeCards;
    }
    return state;
  }

  getHandLog(): HandLogEntry[] {
    return this.log.getAll();
  }

  getSettlements() {
    return this.settlement.getAll();
  }

  replayHand(): GameState {
    const replay = new GameEngine(
      this.machine.getState().players.map((p) => p.id),
    );
    for (const [, action] of this.getHandLog()) {
      replay.applyAction(action);
    }
    return replay.getState();
  }

  private async settle() {
    const state = this.machine.getState();
    const winners = state.players.filter((p) => !p.folded);
    if (winners.length === 0) return;

    if (this.handRepo) {
      const existing = await this.handRepo.findOne({ where: { id: this.handId } });
      if (existing?.settled) return;
    }

    const share = Math.floor(state.pot / winners.length);
    winners.forEach((p) => (p.stack += share));
    const remainder = state.pot - share * winners.length;
    if (remainder > 0) winners[0].stack += remainder;
    state.pot = 0;

    let totalLoss = 0;
    for (const player of state.players) {
      const initial = this.initialStacks.get(player.id) ?? 0;
      const delta = player.stack - initial;
      this.settlement.record({ playerId: player.id, delta });
      const loss = Math.max(initial - player.stack, 0);
      const refund = initial - loss;
      if (this.wallet && refund > 0) {
        await this.wallet.rollback(player.id, refund, this.handId);
      }
      totalLoss += loss;
    }

    if (this.wallet && totalLoss > 0) {
      await this.wallet.commit(this.handId, totalLoss, 0);
    }

    if (this.handRepo) {
      const proof = this.rng.reveal();
      await this.handRepo.save({
        id: this.handId,
        log: JSON.stringify(this.getHandLog()),
        commitment: proof.commitment,
        seed: proof.seed,
        nonce: proof.nonce,
        settled: true,
      });
    }

    this.events?.emit('hand.end', {
      handId: this.handId,
      winners: winners.map((w) => w.id),
    });
  }
}

export type { GameAction, GameState } from '../state-machine';
