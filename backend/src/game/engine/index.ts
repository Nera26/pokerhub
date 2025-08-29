import { HandLog, HandLogEntry } from '../hand-log';
import { HandStateMachine, GameAction, GameState } from '../state-machine';
import { SettlementJournal } from '../settlement';
import { WalletService } from '../../wallet/wallet.service';
import { evaluateHand } from '../hand-evaluator';
import { randomUUID } from 'crypto';
import { HandRNG } from '../rng';
import { Repository } from 'typeorm';
import { Hand } from '../../database/entities/hand.entity';
import { EventPublisher } from '../../events/events.service';
import { resolveRake } from '../rake';

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

  private constructor(
    playerIds: string[] = ['p1', 'p2'],
    private readonly config: {
      startingStack: number;
      smallBlind: number;
      bigBlind: number;
    },
    private readonly wallet?: WalletService,
    private readonly handRepo?: Repository<Hand>,
    private readonly events?: EventPublisher,
    private readonly tableId?: string,
    stake: string = '1-2',
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
  }

  static async create(
    playerIds: string[] = ['p1', 'p2'],
    config: { startingStack: number; smallBlind: number; bigBlind: number } = {
      startingStack: 100,
      smallBlind: 1,
      bigBlind: 2,
    },
    wallet?: WalletService,
    handRepo?: Repository<Hand>,
    events?: EventPublisher,
    tableId?: string,
    stake: string = '1-2',
  ): Promise<GameEngine> {
    const engine = new GameEngine(
      playerIds,
      config,
      wallet,
      handRepo,
      events,
      tableId,
      stake,
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
      await this.wallet!.reserve(player.id, player.stack, this.handId, 'USD');
    }
  }

  getHandId() {
    return this.handId;
  }

  applyAction(action: GameAction): GameState {
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

  getState(): GameState {
    return this.machine.getState();
  }

  getPublicState(): GameState {
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
  replayHand(): GameState {
    const replay = new GameEngine(
      this.machine.getState().players.map((p) => p.id),
      this.config,
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

    // Prefer communityCards but accept legacy 'board'
    const board: number[] =
      (state as any).communityCards ??
      (state as any).board ??
      [];

    // Score hands (robust to evaluation errors)
    const scores = new Map<string, number>();
    for (const p of active) {
      const hole: number[] = (p as any).cards ?? (p as any).holeCards ?? [];
      let score = 0;
      try {
        score = evaluateHand([...hole, ...board]);
      } catch {
        score = 0;
      }
      scores.set(p.id, score);
    }

    // Build pots (supporting side pots)
    const pots =
      state.sidePots.length > 0
        ? [...state.sidePots]
        : [
            {
              amount: state.pot,
              players: active.map((p) => p.id),
              contributions: Object.fromEntries(active.map((p) => [p.id, 0])),
            },
          ];

    // Apply rake to the main pot only (standard room behavior)
    let totalPot = pots.reduce((s, p) => s + p.amount, 0);
    let rake = 0;
    if (this.wallet) {
      rake = resolveRake(totalPot, this.stake);
      if (pots.length > 0) {
        pots[0].amount = Math.max(0, pots[0].amount - rake);
      } else {
        totalPot = Math.max(0, totalPot - rake);
      }
    }

    // Distribute pots to winners
    for (const pot of pots) {
      const contenders = active.filter((p) => pot.players.includes(p.id));
      if (contenders.length === 0) continue;

      const best = Math.max(...contenders.map((p) => scores.get(p.id)!));
      const winners = contenders.filter((p) => scores.get(p.id) === best);
      const share = Math.floor(pot.amount / winners.length);

      for (const w of winners) w.stack += share;

      const remainder = pot.amount - share * winners.length;
      if (remainder > 0) winners[0].stack += remainder;
    }

    state.pot = 0;

    // Compute deltas vs initial stacks; settle wallet reservations
    let totalLoss = 0;
    for (const player of state.players) {
      const initial = this.initialStacks.get(player.id) ?? 0;
      const delta = player.stack - initial;

      this.settlement.record({ playerId: player.id, delta });

      const loss = Math.max(initial - player.stack, 0);
      const refund = initial - loss; // amount to roll back from reservation

      if (this.wallet && refund > 0) {
        await this.wallet.rollback(player.id, refund, this.handId, 'USD');
      }

      totalLoss += loss;
    }

    if (this.wallet && totalLoss > 0) {
      await this.wallet.commit(this.handId, totalLoss, rake, 'USD');
    }

    // Finalize proof and persist final hand log
    const proof = this.rng.reveal();
    this.log.recordProof(proof);

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

    // Emit end event for primary pot winners (if any listeners)
    const mainPotPlayers = pots[0]?.players ?? active.map((p) => p.id);
    const bestMain = Math.max(...mainPotPlayers.map((id) => scores.get(id) ?? 0));
    const mainWinners = mainPotPlayers.filter(
      (id) => (scores.get(id) ?? 0) === bestMain,
    );

    this.events?.emit('hand.end', {
      handId: this.handId,
      winners: mainWinners,
      tableId: this.tableId,
      stake: this.stake,
    });
  }
}

export type { GameAction, GameState } from '../state-machine';
