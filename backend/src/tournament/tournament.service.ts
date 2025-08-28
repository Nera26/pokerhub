import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Tournament,
  TournamentState,
} from '../database/entities/tournament.entity';
import { Seat } from '../database/entities/seat.entity';
import { Table } from '../database/entities/table.entity';
import { TournamentScheduler } from './scheduler.service';
import { calculateIcmPayouts as icmPayouts } from './structures/icm';
import { RoomManager } from '../game/room.service';
import { RebuyService } from './rebuy.service';
import { PkoService } from './pko.service';

@Injectable()
export class TournamentService {
  private currentLevels = new Map<string, number>();
  private patchedLevels = new Map<
    string,
    Map<number, { smallBlind: number; bigBlind: number }>
  >();
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
  ) {}

  async list(): Promise<Tournament[]> {
    return this.tournaments.find();
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

  async openRegistration(id: string): Promise<void> {
    await this.setState(id, TournamentState.REG_OPEN);
  }

  async start(id: string): Promise<void> {
    const t = await this.get(id);
    if (t.state !== TournamentState.REG_OPEN) {
      throw new Error(`Invalid transition from ${t.state} to RUNNING`);
    }
    t.state = TournamentState.RUNNING;
    await this.tournaments.save(t);
  }

  async pause(id: string): Promise<void> {
    const t = await this.get(id);
    if (t.state !== TournamentState.RUNNING) {
      throw new Error(`Invalid transition from ${t.state} to PAUSED`);
    }
    t.state = TournamentState.PAUSED;
    await this.tournaments.save(t);
  }

  async resume(id: string): Promise<void> {
    const t = await this.get(id);
    if (t.state !== TournamentState.PAUSED) {
      throw new Error(`Invalid transition from ${t.state} to RUNNING`);
    }
    t.state = TournamentState.RUNNING;
    await this.tournaments.save(t);
  }

  async finish(id: string): Promise<void> {
    const t = await this.get(id);
    if (
      t.state !== TournamentState.RUNNING &&
      t.state !== TournamentState.PAUSED
    ) {
      throw new Error(`Invalid transition from ${t.state} to FINISHED`);
    }
    t.state = TournamentState.FINISHED;
    await this.tournaments.save(t);
  }

  canRebuy(stack: number, threshold: number): boolean {
    return this.rebuys.canRebuy(stack, threshold);
  }

  applyRebuy(stack: number, chips: number, cost: number) {
    return this.rebuys.apply(stack, chips, cost);
  }

  settleBounty(currentBounty: number) {
    return this.pko.settleBounty(currentBounty);
  }

  private async get(id: string): Promise<Tournament> {
    const t = await this.tournaments.findOne({ where: { id } });
    if (!t) throw new Error(`Tournament ${id} not found`);
    return t;
  }

  private async setState(id: string, state: TournamentState): Promise<void> {
    const t = await this.get(id);
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
  }

  getHotPatchedLevel(
    tournamentId: string,
    level: number,
  ):
    | { smallBlind: number; bigBlind: number }
    | undefined {
    return this.patchedLevels.get(tournamentId)?.get(level);
  }

  async register(tournamentId: string, userId: string): Promise<Seat> {
    const t = await this.get(tournamentId);
    const now = new Date();
    const regOpen = t.state === TournamentState.REG_OPEN;
    const lateReg =
      t.state === TournamentState.RUNNING &&
      t.registrationClose &&
      now < t.registrationClose;
    if (!regOpen && !lateReg) {
      throw new Error('registration closed');
    }
    const tables = await this.tables.find({
      where: { tournament: { id: tournamentId } },
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
    const seat = this.seats.create({
      table: target,
      user: { id: userId } as any,
      position: target.seats.length,
      lastMovedHand: 0,
    });
    return this.seats.save(seat);
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
    const tablePlayers = tables.map((t) =>
      t.seats.map((s) => s.user.id),
    );
    const balanced = this.balanceTables(
      tablePlayers,
      recentlyMoved,
      currentHand,
      avoidWithin,
    );
    for (let i = 0; i < balanced.length; i++) {
      for (const playerId of balanced[i]) {
        const seat = tables
          .flatMap((t) => t.seats)
          .find((s) => s.user.id === playerId);
        if (seat && seat.table.id !== tables[i].id) {
          seat.table = tables[i];
          seat.lastMovedHand = currentHand;
          recentlyMoved.set(playerId, currentHand);
          await this.seats.save(seat);
        }
      }
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
        if (currentHand - (recentlyMoved.get(p) ?? -Infinity) > avoidWithin) {
          player = p;
          result[maxIdx].splice(i, 1);
          break;
        }
      }
      if (!player) player = result[maxIdx].pop();
      if (player) {
        result[minIdx].push(player);
        recentlyMoved.set(player, currentHand);
      }
    }
    return result;
  }

  /**
   * Distribute prize pool according to payout percentages. Supports
   * optional bounty/PKO pools and satellite seat calculation. Remainders
   * are distributed starting from the first place.
   */
  calculatePrizes(
    prizePool: number,
    payouts: number[],
    opts?: {
      bountyPct?: number;
      satelliteSeatCost?: number;
      method?: 'topN' | 'icm';
      stacks?: number[];
    },
  ): {
    prizes: number[];
    bountyPool?: number;
    seats?: number;
    remainder?: number;
  } {
    let pool = prizePool;
    let bountyPool: number | undefined;
    if (opts?.bountyPct) {
      const split = this.pko.splitPrizePool(pool, opts.bountyPct);
      pool = split.prizePool;
      bountyPool = split.bountyPool;
    }

    let seats: number | undefined;
    let remainder: number | undefined;
    if (opts?.satelliteSeatCost) {
      seats = Math.floor(pool / opts.satelliteSeatCost);
      remainder = pool - seats * opts.satelliteSeatCost;
      pool = remainder;
    }

    let prizes: number[];
    if (opts?.method === 'icm' && opts.stacks) {
      prizes = this.calculateIcmPayouts(opts.stacks, payouts);
      remainder = pool - prizes.reduce((a, b) => a + b, 0);
    } else {
      prizes = payouts.map((p) => Math.floor(pool * p));
      remainder = pool - prizes.reduce((a, b) => a + b, 0);
    }
    let i = 0;
    while (remainder > 0) {
      prizes[i % prizes.length] += 1;
      remainder--;
      i++;
    }

    const response: {
      prizes: number[];
      bountyPool?: number;
      seats?: number;
      remainder?: number;
    } = { prizes };

    if (bountyPool !== undefined) response.bountyPool = bountyPool;
    if (seats !== undefined) response.seats = seats;
    if (remainder !== undefined) response.remainder = remainder;

    return response;
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
}
