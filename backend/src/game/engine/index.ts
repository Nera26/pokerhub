import { HandLog, HandLogEntry } from '../hand-log';
import {
  HandStateMachine,
  GameAction,
  GameStateInternal,
} from '../state-machine';
import { SettlementJournal, recordDeltas } from '../settlement';
import { WalletService } from '../../wallet/wallet.service';
import { SettlementService } from '../../wallet/settlement.service';
import { writeHandLedger } from '../../wallet/hand-ledger';
import { randomUUID } from 'crypto';
import { HandRNG } from '../rng';
import { Repository } from 'typeorm';
import { Hand } from '../../database/entities/hand.entity';
import { EventPublisher } from '../../events/events.service';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

/**
 * GameEngine orchestrates the poker hand state machine, keeping
 * track of per-action logs and settlement results.
 */
export class GameEngine {
  private readonly log: HandLog;
  private readonly settlement = new SettlementJournal();
  private readonly initialStacks: Map<string, number>; // for delta calc
  private readonly machine: HandStateMachine;
  private readonly handId = randomUUID();
  private readonly rng = new HandRNG();
  private readonly stake: string;
  private readonly currency: string;

  private constructor(
    playerIds: string[] = ['p1', 'p2'],
    private readonly config: {
      startingStack: number;
      smallBlind: number;
      bigBlind: number;
    },
    private readonly wallet?: WalletService,
    private readonly settlementSvc?: SettlementService,
    private readonly handRepo?: Repository<Hand>,
    private readonly events?: EventPublisher,
    private readonly tableId?: string,
    stake: string = '1-2',
    currency = 'USD',
  ) {
    const players = playerIds.map((id) => ({
      id,
      stack: config.startingStack,
      folded: false,
      bet: 0,
      allIn: false,
    }));

    this.initialStacks = new Map(players.map((p) => [p.id, p.stack]));

    this.machine = new HandStateMachine(
      {
        phase: 'WAIT_BLINDS',
        street: 'preflop',
        pot: 0,
        sidePots: [],
        currentBet: 0,
        players,
        deck: [],
        communityCards: [],
      },
      this.rng,
      { smallBlind: config.smallBlind, bigBlind: config.bigBlind },
    );

    this.log = new HandLog(this.handId, this.rng.commitment);

    // Persist initial hand shell if a repo is provided (non-blocking)
    if (this.handRepo) {
      void this.handRepo.save({
        id: this.handId,
        log: JSON.stringify(this.getHandLog()),
        commitment: this.rng.commitment,
        seed: null,
        nonce: null,
        settled: false,
        tableId: this.tableId ?? null,
        stake,
      } as any);
    }

    this.stake = stake;
    this.currency = currency;
  }

  static async create(
    playerIds: string[] = ['p1', 'p2'],
    config: { startingStack: number; smallBlind: number; bigBlind: number } = {
      startingStack: 100,
      smallBlind: 1,
      bigBlind: 2,
    },
    wallet?: WalletService,
    settlementSvc?: SettlementService,
    handRepo?: Repository<Hand>,
    events?: EventPublisher,
    tableId?: string,
    stake: string = '1-2',
    currency = 'USD',
  ): Promise<GameEngine> {
    const engine = new GameEngine(
      playerIds,
      config,
      wallet,
      settlementSvc,
      handRepo,
      events,
      tableId,
      stake,
      currency,
    );

    if (wallet) {
      await engine.reserveStacks();
    }

    events?.emit('hand.start', {
      handId: engine.handId,
      players: playerIds,
      tableId,
      stake,
    });

    return engine;
  }

  private async reserveStacks() {
    const state = this.machine.getState();
    for (const player of state.players) {
      await this.wallet!.reserve(
        player.id,
        player.stack,
        this.handId,
        this.currency,
      );
    }
  }

  getHandId() {
    return this.handId;
  }

  applyAction(action: GameAction): GameStateInternal {
    // Use a safe deep clone (structuredClone is available in modern runtimes)
    const preState = structuredClone(this.machine.getState());
    let state = this.machine.apply(action);

    // If only one player remains, move directly to showdown
    if (
      this.machine.activePlayers().length <= 1 &&
      state.phase === 'BETTING_ROUND'
    ) {
      state.phase = 'SHOWDOWN';
    }

    if (state.phase === 'SHOWDOWN') {
      // Advance to reveal / settle stage
      state = this.machine.apply({ type: 'next' });
      void this.settle();
    }

    const postState = structuredClone(this.machine.getState());
    this.log.record(action, preState, postState);

    return postState;
  }

  getState(): GameStateInternal {
    return this.machine.getState();
  }

  getPublicState(): GameStateInternal {
    const state = structuredClone(this.machine.getState());
    // Strip private info (hole cards, deck)
    for (const player of state.players as unknown as Array<Record<string, unknown>>) {
      delete player.cards;
      delete (player as any)['holeCards'];
    }
    delete (state as any).deck;
    return state;
  }

  getHandLog(): HandLogEntry[] {
    return this.log.getAll();
  }

  getHandProof() {
    return this.log.getProof();
  }

  getSettlements() {
    return this.settlement.getAll();
  }

  /**
   * Replays the hand in-memory without touching wallet/DB/events.
   * We preserve blinds/stack config and stake, but intentionally
   * do NOT pass wallet/handRepo/events/tableId to avoid side effects.
   */
  replayHand(): GameStateInternal {
    const replay = new GameEngine(
      this.machine.getState().players.map((p) => p.id),
      this.config,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      this.stake,
    );

    for (const [, action] of this.getHandLog()) {
      replay.applyAction(action);
    }

    return replay.getState();
  }

  private async settle() {
    const state = this.machine.getState();
    const active = state.players.filter((p) => !p.folded);
    if (active.length === 0) return;

    // Guard against double settlement from persistence races
    if (this.handRepo) {
      const existing = await this.handRepo.findOne({ where: { id: this.handId } });
      if (existing?.settled) return;
    }

    const entries = recordDeltas(state, this.initialStacks, this.settlement);
    const street = state.street;

    if (this.wallet) {
      const ds =
        (this.wallet as any)?.journals?.manager?.connection ??
        (this.wallet as any)?.journals?.manager?.dataSource;
      if (ds) {
        await writeHandLedger(
          this.wallet,
          ds,
          this.handId,
          street,
          0,
          entries,
          this.currency,
        );
      }
    }

    let idx = 1;
    let totalLoss = 0;
    for (const { playerId, delta } of entries) {
      const initial = this.initialStacks.get(playerId) ?? 0;
      const loss = delta < 0 ? -delta : 0;
      const refund = initial - loss;

      if (this.wallet && refund > 0) {
        const key = `${this.handId}#${street}#${idx}`;
        await this.settlementSvc?.reserve(this.handId, street, idx);
        await this.wallet.rollback(
          playerId,
          refund,
          this.handId,
          this.currency,
          key,
        );
        idx++;
      }

      totalLoss += loss;
    }

    if (this.wallet && totalLoss > 0) {
      const key = `${this.handId}#${street}#${idx}`;
      await this.settlementSvc?.reserve(this.handId, street, idx);
      await this.wallet.commit(
        this.handId,
        totalLoss,
        0,
        this.currency,
        key,
      );
    }

    // Finalize proof and persist final hand log
    const proof = this.rng.reveal();
    this.log.recordProof(proof);

    try {
      const dir = path.resolve(process.cwd(), '..', 'storage', 'proofs');
      mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${this.handId}.json`);
      writeFileSync(file, JSON.stringify(proof));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('failed to write proof file', err);
    }

    if (this.handRepo) {
      await this.handRepo.save({
        id: this.handId,
        log: JSON.stringify(this.getHandLog()),
        commitment: proof.commitment,
        seed: proof.seed,
        nonce: proof.nonce,
        settled: true,
        tableId: this.tableId ?? null,
        stake: this.stake,
      } as any);
    }

    const winners = entries
      .filter((e) => e.delta > 0)
      .map((e) => e.playerId);

    this.events?.emit('hand.settle', {
      handId: this.handId,
      tableId: this.tableId,
      playerIds: entries.map((e) => e.playerId),
      deltas: entries.map((e) => e.delta),
      stake: this.stake,
    });

    this.events?.emit('leaderboard.hand_settled', {
      handId: this.handId,
      tableId: this.tableId,
      playerIds: entries.map((e) => e.playerId),
      deltas: entries.map((e) => e.delta),
    });

    this.events?.emit('hand.end', {
      handId: this.handId,
      winners,
      tableId: this.tableId,
      stake: this.stake,
    });
  }
}

export type {
  GameAction,
  GameStateInternal as InternalGameState,
} from '../state-machine';
