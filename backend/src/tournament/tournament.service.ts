import { Inject, Injectable, Optional, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type Redis from 'ioredis';
import { saveRecentlyMoved } from './redis.util';
import { Repository } from 'typeorm';
import {
  Tournament,
  TournamentState,
} from '../database/entities/tournament.entity';
import { Seat } from '../database/entities/seat.entity';
import { Table } from '../database/entities/table.entity';
import { TournamentScheduler } from './scheduler.service';
import { calculateIcmPayouts as icmPayouts, icmRaw } from '@shared/utils/icm';
import { RoomManager } from '../game/room.service';
import { RebuyService } from './rebuy.service';
import {
  PkoService,
  calculatePrizes as calculatePrizesFn,
  CalculatePrizeOptions,
} from './pko.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { EventPublisher } from '../events/events.service';
import { WalletService } from '../wallet/wallet.service';
import {
  TournamentFiltersResponseSchema,
  type TournamentFilterOption,
  type AdminTournament,
  type TournamentFormatOption,
} from '@shared/types';
import { TournamentsProducer } from '../messaging/tournaments/tournaments.producer';
import { BotProfileRepository } from './bot-profile.repository';
import { BotProfilesResponseSchema } from '@shared/types';
import { TournamentFilterOptionRepository } from './tournament-filter-option.repository';
import { TournamentDetailRepository } from './tournament-detail.repository';
import { TournamentDetailType } from './tournament-detail.entity';
import { TournamentFormatRepository } from './tournament-format.repository';

@Injectable()
export class TournamentService implements OnModuleInit {
  private currentLevels = new Map<string, number>();
  private patchedLevels = new Map<
    string,
    Map<number, { smallBlind: number; bigBlind: number }>
  >();
  private bubbleAnnounced = new Set<string>();
  constructor(
    @InjectRepository(Tournament)
    private readonly tournaments: Repository<Tournament>,
    @InjectRepository(Seat)
    private readonly seats: Repository<Seat>,
    @InjectRepository(Table)
    private readonly tables: Repository<Table>,
    private readonly scheduler: TournamentScheduler,
    private readonly rooms: RoomManager,
    private readonly rebuys: RebuyService,
    private readonly pko: PkoService,
    private readonly flags: FeatureFlagsService,
    private readonly events: EventPublisher,
    private readonly producer: TournamentsProducer,
    private readonly botProfiles: BotProfileRepository,
    private readonly filterOptions: TournamentFilterOptionRepository,
    private readonly formatRepository: TournamentFormatRepository,
    @Optional()
    private readonly detailsRepository?: TournamentDetailRepository,
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
    @Optional() private readonly wallet?: WalletService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.redis) return;
    const levelKeys = await this.redis.keys('tournament:*:currentLevel');
    if (levelKeys.length) {
      const values = await this.redis.mget(levelKeys);
      for (let i = 0; i < levelKeys.length; i++) {
        const key = levelKeys[i];
        const value = values[i];
        if (value !== null) {
          const tournamentId = key.split(':')[1];
          this.currentLevels.set(tournamentId, Number(value));
        }
      }
    }
    const patchKeys = await this.redis.keys('tournament:*:patchedLevels');
    for (const key of patchKeys) {
      const value = await this.redis.get(key);
      if (!value) continue;
      const tournamentId = key.split(':')[1];
      const parsed = JSON.parse(value) as Record<
        string,
        {
          smallBlind: number;
          bigBlind: number;
        }
      >;
      const levelMap = new Map<
        number,
        { smallBlind: number; bigBlind: number }
      >();
      for (const [lvl, blinds] of Object.entries(parsed)) {
        levelMap.set(Number(lvl), blinds);
      }
      this.patchedLevels.set(tournamentId, levelMap);
    }
  }

  async list(): Promise<Tournament[]> {
    return this.tournaments.find();
  }

  async getFilterOptions(): Promise<TournamentFilterOption[]> {
    const options = await this.filterOptions.find({
      order: { value: 'ASC' },
    });
    return TournamentFiltersResponseSchema.parse(
      options.map(({ label, value }) => ({ label, value })),
    );
  }

  async listFormats(): Promise<TournamentFormatOption[]> {
    const rows = await this.formatRepository.find({
      order: { sortOrder: 'ASC' },
    });
    return rows.map(({ id, label }) => ({ id, label }));
  }

  async getBotProfiles() {
    const res = await this.botProfiles.find({
      select: ['name', 'proportion', 'bustMultiplier'],
    });
    return BotProfilesResponseSchema.parse(res);
  }

  async getDefaultTournament(): Promise<AdminTournament> {
    const [defaults] = await this.tournaments.query(
      `SELECT id,
              name,
              game_type AS "gameType",
              buyin,
              fee,
              prize_pool AS "prizePool",
              date,
              time,
              format,
              seat_cap AS "seatCap",
              description,
              rebuy,
              addon,
              status
       FROM tournament_defaults
       LIMIT 1`,
    );
    return defaults;
  }

  async get(id: string, userId?: string) {
    const t = await this.getEntity(id);
    const playerCount = await this.seats.count({
      where: { table: { tournament: { id } } } as any,
    });
    let registered = false;
    if (userId) {
      registered = await this.seats.exists({
        where: { table: { tournament: { id } }, user: { id: userId } } as any,
      });
    }
    const detailRows =
      (await this.detailsRepository?.find({
        where: { tournamentId: id },
        order: { sortOrder: 'ASC', id: 'ASC' },
      })) ?? [];

    const groupedDetails: Record<
      TournamentDetailType,
      { title: string; description: string }[]
    > = {
      [TournamentDetailType.OVERVIEW]: [],
      [TournamentDetailType.STRUCTURE]: [],
      [TournamentDetailType.PRIZES]: [],
    };

    const sortedRows = [...detailRows].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.id.localeCompare(b.id);
    });

    for (const row of sortedRows) {
      const bucket = groupedDetails[row.type];
      if (bucket) {
        bucket.push({ title: row.title, description: row.description });
      }
    }

    return {
      id: t.id,
      title: t.title,
      buyIn: t.buyIn,
      currency: t.currency,
      gameType: t.gameType,
      prizePool: t.prizePool,
      state: t.state,
      players: { current: playerCount, max: t.maxPlayers },
      registered,
      registration: {
        open: t.registrationOpen ?? null,
        close: t.registrationClose ?? null,
      },
      overview: groupedDetails[TournamentDetailType.OVERVIEW],
      structure: groupedDetails[TournamentDetailType.STRUCTURE],
      prizes: groupedDetails[TournamentDetailType.PRIZES],
    };
  }

  async getState(id: string): Promise<TournamentState | undefined> {
    return (await this.tournaments.findOne({ where: { id } }))?.state;
  }

  async scheduleTournament(
    tournamentId: string,
    opts: {
      registration: { open: Date; close: Date };
      structure: { level: number; durationMinutes: number }[];
      breaks: { start: Date; durationMs: number }[];
      start: Date;
    },
  ): Promise<void> {
    await this.scheduler.scheduleRegistration(
      tournamentId,
      opts.registration.open,
      opts.registration.close,
    );
    for (const b of opts.breaks) {
      await this.scheduler.scheduleBreak(tournamentId, b.start, b.durationMs);
    }
    await this.scheduler.scheduleLevelUps(
      tournamentId,
      opts.structure,
      opts.start,
    );
  }

  async scheduleStart(id: string, start: Date): Promise<void> {
    this.producer.scheduleTournament(id, start);
  }

  async openRegistration(id: string): Promise<void> {
    await this.setState(id, TournamentState.REG_OPEN);
  }

  async start(id: string): Promise<void> {
    const t = await this.getEntity(id);
    if (t.state !== TournamentState.REG_OPEN) {
      throw new Error(`Invalid transition from ${t.state} to RUNNING`);
    }
    t.state = TournamentState.RUNNING;
    await this.tournaments.save(t);
  }

  async pause(id: string): Promise<void> {
    const t = await this.getEntity(id);
    if (t.state !== TournamentState.RUNNING) {
      throw new Error(`Invalid transition from ${t.state} to PAUSED`);
    }
    t.state = TournamentState.PAUSED;
    await this.tournaments.save(t);
  }

  async resume(id: string): Promise<void> {
    const t = await this.getEntity(id);
    if (t.state !== TournamentState.PAUSED) {
      throw new Error(`Invalid transition from ${t.state} to RUNNING`);
    }
    t.state = TournamentState.RUNNING;
    await this.tournaments.save(t);
  }

  async finish(id: string): Promise<void> {
    const t = await this.getEntity(id);
    if (
      t.state !== TournamentState.RUNNING &&
      t.state !== TournamentState.PAUSED
    ) {
      throw new Error(`Invalid transition from ${t.state} to FINISHED`);
    }
    t.state = TournamentState.FINISHED;
    await this.tournaments.save(t);
  }

  async cancel(id: string): Promise<void> {
    const t = await this.getEntity(id);
    if (
      t.state !== TournamentState.REG_OPEN &&
      t.state !== TournamentState.RUNNING &&
      t.state !== TournamentState.PAUSED
    ) {
      throw new Error(`Invalid transition from ${t.state} to CANCELLED`);
    }
    t.state = TournamentState.CANCELLED;
    await this.tournaments.save(t);
    if (this.wallet) {
      const seats = await this.seats.find({
        where: { table: { tournament: { id } } } as any,
        relations: ['user'],
      });
      const currency = t.currency ?? 'USD';
      for (const seat of seats) {
        await this.wallet.rollback(seat.user.id, t.buyIn, id, currency);
        await this.events.emit('wallet.rollback', {
          accountId: seat.user.id,
          amount: t.buyIn,
          refId: id,
          currency,
        });
        await this.events.emit('notification.create', {
          userId: seat.user.id,
          type: 'tournament',
          message: `Tournament ${t.title} cancelled`,
        });
      }
    }
    await this.events.emit('tournament.cancel', { tournamentId: id });
  }

  async canRebuy(stack: number, threshold: number): Promise<boolean> {
    if ((await this.flags.get('rebuy')) === false) {
      return false;
    }
    return this.rebuys.canRebuy(stack, threshold);
  }

  applyRebuy(stack: number, chips: number, cost: number) {
    return this.rebuys.apply(stack, chips, cost);
  }

  async settleBounty(currentBounty: number, tournamentId?: string) {
    if (
      (await this.flags.get('settlement')) === false ||
      (tournamentId &&
        (await this.flags.getTourney(tournamentId, 'settlement')) === false)
    ) {
      return { playerAward: 0, newBounty: currentBounty };
    }
    return this.pko.settleBounty(currentBounty);
  }

  private async getEntity(id: string): Promise<Tournament> {
    const t = await this.tournaments.findOne({ where: { id } });
    if (!t) throw new Error(`Tournament ${id} not found`);
    return t;
  }

  private async setState(id: string, state: TournamentState): Promise<void> {
    const t = await this.getEntity(id);
    t.state = state;
    await this.tournaments.save(t);
  }

  /**
   * Enter a scheduled break. The tournament state is set to PAUSED and
   * normal play resumes when {@link endBreak} is called.
   */
  async startBreak(id: string): Promise<void> {
    await this.pause(id);
  }

  /** Resume play after a break. */
  async endBreak(id: string): Promise<void> {
    await this.resume(id);
  }

  /**
   * Auto-fold a player when their action times out. Returns the action taken
   * so calling code can broadcast it to the table.
   */
  async autoFoldOnTimeout(seatId: string): Promise<'fold'> {
    const seat = await this.seats.findOne({
      where: { id: seatId },
      relations: ['table', 'user'],
    });
    if (!seat) {
      throw new Error(`Seat ${seatId} not found`);
    }
    const room = this.rooms.get(seat.table.id);
    await room.apply({ type: 'fold', playerId: seat.user.id });
    return 'fold';
  }

  /**
   * Handle a level up. The current level is tracked per tournament so that
   * all tables stay synchronized.
   */
  async handleLevelUp(tournamentId: string, level: number): Promise<void> {
    this.currentLevels.set(tournamentId, level);
    await this.redis?.set(
      `tournament:${tournamentId}:currentLevel`,
      level.toString(),
    );
  }

  getCurrentLevel(tournamentId: string): number {
    return this.currentLevels.get(tournamentId) ?? 1;
  }

  /**
   * Hot patch the blinds for a specific level. The values are stored in
   * memory so new tables can pick them up immediately.
   */
  async hotPatchLevel(
    tournamentId: string,
    level: number,
    smallBlind: number,
    bigBlind: number,
  ): Promise<void> {
    let levels = this.patchedLevels.get(tournamentId);
    if (!levels) {
      levels = new Map();
      this.patchedLevels.set(tournamentId, levels);
    }
    levels.set(level, { smallBlind, bigBlind });
    await this.redis?.set(
      `tournament:${tournamentId}:patchedLevels`,
      JSON.stringify(
        Object.fromEntries(
          Array.from(levels.entries()).map(([lvl, blinds]) => [
            lvl.toString(),
            blinds,
          ]),
        ),
      ),
    );
  }

  getHotPatchedLevel(
    tournamentId: string,
    level: number,
  ): { smallBlind: number; bigBlind: number } | undefined {
    return this.patchedLevels.get(tournamentId)?.get(level);
  }

  async join(tournamentId: string, userId: string): Promise<Seat> {
    const t = await this.getEntity(tournamentId);
    const now = new Date();
    const regOpen = t.state === TournamentState.REG_OPEN;
    const lateReg =
      t.state === TournamentState.RUNNING &&
      t.registrationClose &&
      now < t.registrationClose;
    if (!regOpen && !lateReg) {
      throw new Error('registration closed');
    }
    const { seat, walletEvent } = await this.assignSeat(
      tournamentId,
      userId,
      'join',
    );
    if (walletEvent) {
      await this.events.emit('wallet.reserve', walletEvent);
    }
    return seat!;
  }

  async withdraw(tournamentId: string, userId: string): Promise<void> {
    const { walletEvent } = await this.assignSeat(
      tournamentId,
      userId,
      'withdraw',
    );
    if (walletEvent) {
      await this.events.emit('wallet.rollback', walletEvent);
    }
  }

  private async assignSeat(
    tournamentId: string,
    userId: string,
    action: 'join' | 'withdraw',
  ): Promise<{
    seat?: Seat;
    walletEvent?: {
      accountId: string;
      amount: number;
      refId: string;
      currency: string;
    };
  }> {
    const { currency = 'USD' } = await this.getEntity(tournamentId);
    let result: {
      seat?: Seat;
      walletEvent?: {
        accountId: string;
        amount: number;
        refId: string;
        currency: string;
      };
    } = {};
    const manager: any = this.seats.manager as any;
    if (manager?.transaction) {
      await manager.transaction(async (txManager: any) => {
        result = await this.manageSeat(
          action,
          { tournamentId, userId, currency },
          txManager,
        );
      });
      return result;
    }

    return this.manageSeat(action, { tournamentId, userId, currency });
  }

  private async manageSeat(
    action: 'join' | 'withdraw',
    opts: { tournamentId: string; userId: string; currency: string },
    txManager?: any,
  ): Promise<{
    seat?: Seat;
    walletEvent?: {
      accountId: string;
      amount: number;
      refId: string;
      currency: string;
    };
  }> {
    const { tournamentId, userId, currency } = opts;
    const t = await this.getEntity(tournamentId);
    let seat: Seat | undefined;
    let walletEvent:
      | {
          accountId: string;
          amount: number;
          refId: string;
          currency: string;
        }
      | undefined;

    if (action === 'join') {
      if (this.wallet) {
        await this.wallet.reserve(userId, t.buyIn, tournamentId, currency);
        walletEvent = {
          accountId: userId,
          amount: t.buyIn,
          refId: tournamentId,
          currency,
        };
      }
      const tables = txManager
        ? await txManager.find(Table, {
            where: { tournament: { id: tournamentId } } as any,
            relations: ['seats'],
          })
        : await this.tables.find({
            where: { tournament: { id: tournamentId } } as any,
            relations: ['seats'],
          });
      let target = tables[0];
      let min = tables[0]?.seats.length ?? 0;
      for (const tbl of tables) {
        if (tbl.seats.length < min) {
          min = tbl.seats.length;
          target = tbl;
        }
      }
      const seatRepo = txManager ? txManager.getRepository(Seat) : this.seats;
      seat = seatRepo.create({
        table: target,
        user: { id: userId } as any,
        position: target.seats.length,
        lastMovedHand: 0,
      });
      try {
        await seatRepo.save(seat);
      } catch (err) {
        if (this.wallet) {
          await this.wallet.rollback(userId, t.buyIn, tournamentId, currency);
          walletEvent = undefined;
        }
        throw err;
      }
      return { seat, walletEvent };
    }

    const seatRepo = txManager ? txManager.getRepository(Seat) : this.seats;
    const existing = txManager
      ? await txManager.findOne(Seat, {
          where: {
            table: { tournament: { id: tournamentId } } as any,
            user: { id: userId } as any,
          },
          relations: ['table', 'user'],
        })
      : await this.seats.findOne({
          where: {
            table: { tournament: { id: tournamentId } } as any,
            user: { id: userId } as any,
          },
          relations: ['table', 'user'],
        });
    if (!existing) {
      return {};
    }
    if (this.wallet) {
      await this.wallet.rollback(userId, t.buyIn, tournamentId, currency);
      walletEvent = {
        accountId: userId,
        amount: t.buyIn,
        refId: tournamentId,
        currency,
      };
    }
    await seatRepo.remove(existing);
    return { walletEvent };
  }

  async balanceTournament(
    tournamentId: string,
    currentHand = 0,
    avoidWithin = 10,
    recentlyMoved: Map<string, number> = new Map(),
  ): Promise<void> {
    const tables = await this.tables.find({
      where: { tournament: { id: tournamentId } },
      relations: ['seats', 'seats.user'],
    });
    const tablePlayers = tables.map((t) => t.seats.map((s) => s.user.id));
    const balanced = this.balanceTables(
      tablePlayers,
      recentlyMoved,
      currentHand,
      avoidWithin,
    );
    const movedSeats: Seat[] = [];
    for (let i = 0; i < balanced.length; i++) {
      for (const playerId of balanced[i]) {
        const seat = tables
          .flatMap((t) => t.seats)
          .find((s) => s.user.id === playerId);
        if (seat && seat.table.id !== tables[i].id) {
          seat.table = tables[i];
          seat.lastMovedHand = currentHand;
          recentlyMoved.set(playerId, currentHand);
          movedSeats.push(seat);
        }
      }
    }
    if (movedSeats.length > 0) {
      await this.seats.save(movedSeats);
    }
    if (this.redis) {
      await saveRecentlyMoved(this.redis, tournamentId, recentlyMoved);
    }
  }

  /**
   * Balance players across tables so that the difference between the
   * largest and smallest table is at most one player. Players who were
   * moved within the last `avoidWithin` hands are skipped when possible to
   * reduce churn.
   */
  balanceTables(
    tables: string[][],
    recentlyMoved: Map<string, number> = new Map(),
    currentHand = 0,
    avoidWithin = 10,
  ): string[][] {
    const result = tables.map((t) => [...t]);
    while (true) {
      let max = 0;
      let min = Infinity;
      let maxIdx = 0;
      let minIdx = 0;
      result.forEach((t, i) => {
        if (t.length > max) {
          max = t.length;
          maxIdx = i;
        }
        if (t.length < min) {
          min = t.length;
          minIdx = i;
        }
      });
      if (max - min <= 1) break;

      let player: string | undefined;
      for (let i = result[maxIdx].length - 1; i >= 0; i--) {
        const p = result[maxIdx][i];
        if (currentHand - (recentlyMoved.get(p) ?? -Infinity) >= avoidWithin) {
          player = p;
          result[maxIdx].splice(i, 1);
          break;
        }
      }
      if (!player) break; // no eligible player without violating avoidWithin
      result[minIdx].push(player);
      recentlyMoved.set(player, currentHand);
    }
    return result;
  }

  /**
   * Distribute prize pool according to payout percentages. Supports optional
   * bounty/PKO pools and satellite seat calculation. Remainders are
   * distributed starting from the first place.
   */
  calculatePrizes(
    prizePool: number,
    payouts: number[],
    opts?: CalculatePrizeOptions,
  ): {
    prizes: number[];
    bountyPool?: number;
    seats?: number;
    remainder?: number;
  } {
    return calculatePrizesFn(prizePool, payouts, opts);
  }

  /**
   * Detect when the field has reached the bubble (one spot from payouts).
   * Emits a `tournament.bubble` event the first time this occurs.
   */
  async detectBubble(
    tournamentId: string,
    remainingPlayers: number,
    payoutThreshold: number,
  ): Promise<boolean> {
    if (
      remainingPlayers !== payoutThreshold ||
      this.bubbleAnnounced.has(tournamentId)
    ) {
      return false;
    }
    this.bubbleAnnounced.add(tournamentId);
    await this.events.emit('tournament.bubble', {
      tournamentId,
      remainingPlayers,
    });
    return true;
  }

  /**
   * Resolve simultaneous bust outs on the bubble. Players share the
   * combined prizes for the affected positions. Any odd chips are awarded to
   * players with the largest starting stacks.
   */
  resolveBubbleElimination(
    busts: { id: string; stack: number }[],
    prizes: number[],
  ): { id: string; prize: number }[] {
    const sorted = [...busts].sort((a, b) => b.stack - a.stack);
    const pot = prizes.slice(0, sorted.length).reduce((a, b) => a + b, 0);
    const base = Math.floor(pot / sorted.length);
    let remainder = pot - base * sorted.length;
    return sorted.map((p, i) => ({
      id: p.id,
      prize: base + (i < remainder ? 1 : 0),
    }));
  }

  /**
   * Calculate ICM payouts for remaining players. Results are rounded so the
   * total error is less than one chip.
   */
  calculateIcmPayouts(stacks: number[], prizes: number[]): number[] {
    return icmPayouts(stacks, prizes);
  }

  /**
   * Compute raw ICM expectations without rounding. Useful for validation.
   */
  icmExpectedPayouts(stacks: number[], prizes: number[]): number[] {
    return icmRaw(stacks, prizes);
  }
}
