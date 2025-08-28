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

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournaments: Repository<Tournament>,
    @InjectRepository(Seat)
    private readonly seats: Repository<Seat>,
    @InjectRepository(Table)
    private readonly tables: Repository<Table>,
    private readonly scheduler: TournamentScheduler,
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
  ): Promise<void> {
    const tables = await this.tables.find({
      where: { tournament: { id: tournamentId } },
      relations: ['seats', 'seats.user'],
    });
    const recentlyMoved = new Map<string, number>();
    const tablePlayers = tables.map((t) =>
      t.seats.map((s) => {
        recentlyMoved.set(s.user.id, s.lastMovedHand);
        return s.user.id;
      }),
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
    opts?: { bountyPct?: number; satelliteSeatCost?: number },
  ): {
    prizes: number[];
    bountyPool?: number;
    seats?: number;
    remainder?: number;
  } {
    let pool = prizePool;
    let bountyPool: number | undefined;
    if (opts?.bountyPct) {
      bountyPool = Math.floor(pool * opts.bountyPct);
      pool -= bountyPool;
    }

    let seats: number | undefined;
    let remainder: number | undefined;
    if (opts?.satelliteSeatCost) {
      seats = Math.floor(pool / opts.satelliteSeatCost);
      remainder = pool - seats * opts.satelliteSeatCost;
      pool = remainder;
    }

    const prizes = payouts.map((p) => Math.floor(pool * p));
    remainder = pool - prizes.reduce((a, b) => a + b, 0);
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
}
