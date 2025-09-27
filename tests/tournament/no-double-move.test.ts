import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'reflect-metadata';

interface Player { id: string }
interface Table { id: string; seats: Seat[]; tournament: { id: string } }
interface Seat {
  id: string;
  position: number;
  table: Table;
  user: Player;
  lastMovedHand: number;
}

class StubTournamentService {
  constructor(private tables: { find: Function }, private seats: { save: Function }) {}

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
    const tablePlayers = tables.map((t: Table) => t.seats.map((s) => s.user.id));
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
          .flatMap((t: Table) => t.seats)
          .find((s: Seat) => s.user.id === playerId)!;
        if (seat.table.id !== tables[i].id) {
          const from = seat.table as Table;
          from.seats = from.seats.filter((s) => s !== seat);
          tables[i].seats.push(seat);
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
  }

  balanceTables(
    tables: string[][],
    recentlyMoved: Map<string, number>,
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
      if (!player) break;
      result[minIdx].push(player);
      recentlyMoved.set(player, currentHand);
    }
    return result;
  }

  async detectBubble(): Promise<boolean> {
    return false;
  }
}

test('balancer avoids moving players twice within avoidWithin hands', async () => {
  const Module = require('module');
  const originalLoad = Module._load;
  Module._load = function (request: string, parent: any, isMain: boolean) {
    if (request.endsWith('/database/entities/table.entity.ts')) {
      return { Table: class {} };
    }
    if (request.endsWith('/tournament/tournament.service.ts')) {
      return { TournamentService: class {} };
    }
    if (request === '@shared/events') {
      return {};
    }
    return originalLoad(request, parent, isMain);
  };
  const { TableBalancerService } = await import(
    '../../backend/src/tournament/table-balancer.service.ts'
  );
  Module._load = originalLoad;

  const avoidWithin = 3;
  const tournamentId = 't1';

  const createTable = (id: string): Table => ({ id, seats: [], tournament: { id } } as any);
  const tableA = createTable('A');
  const tableB = createTable('B');

  const allSeats: Seat[] = [];
  for (let i = 1; i <= 6; i++) {
    const seat: Seat = {
      id: `a${i}`,
      position: i,
      table: tableA,
      user: { id: `a${i}` } as any,
      lastMovedHand: 0,
    } as any;
    tableA.seats.push(seat);
    allSeats.push(seat);
  }
  for (let i = 1; i <= 6; i++) {
    const seat: Seat = {
      id: `b${i}`,
      position: i,
      table: tableB,
      user: { id: `b${i}` } as any,
      lastMovedHand: 0,
    } as any;
    tableB.seats.push(seat);
    allSeats.push(seat);
  }

  const tablesRepo = {
    async find() {
      return [tableA, tableB];
    },
  };
  const tables = [tableA, tableB];
  const seatsRepo = {
    async save(arg: Seat | Seat[]) {
      const seats = Array.isArray(arg) ? arg : [arg];
      for (const seat of seats) {
        for (const table of tables) {
          table.seats = table.seats.filter((existing) => existing.id !== seat.id);
        }
        seat.table.seats.push(seat);
      }
      return Array.isArray(arg) ? seats : seats[0];
    },
  };

  const tService = new StubTournamentService(tablesRepo, seatsRepo);
  const balancer = new TableBalancerService(tablesRepo as any, tService as any);

  const moveHistory = new Map<string, number[]>();
  const recordMoves = (hand: number) => {
    for (const seat of allSeats) {
      if (seat.lastMovedHand === hand) {
        const arr = moveHistory.get(seat.user.id) ?? [];
        arr.push(hand);
        moveHistory.set(seat.user.id, arr);
      }
    }
  };
  const removePlayers = (table: Table, count: number) => {
    for (let i = 0; i < count && table.seats.length > 0; i++) {
      table.seats.shift();
    }
  };

  removePlayers(tableB, 2);
  await balancer.rebalanceIfNeeded(tournamentId, 1, avoidWithin);
  recordMoves(1);

  removePlayers(tableA, 2);
  await balancer.rebalanceIfNeeded(tournamentId, 2, avoidWithin);
  recordMoves(2);

  removePlayers(tableB, 2);
  await balancer.rebalanceIfNeeded(tournamentId, 3, avoidWithin);
  recordMoves(3);

  removePlayers(tableA, 2);
  await balancer.rebalanceIfNeeded(tournamentId, 4, avoidWithin);
  recordMoves(4);

  removePlayers(tableB, 2);
  await balancer.rebalanceIfNeeded(tournamentId, 5, avoidWithin);
  recordMoves(5);

  for (const [player, hands] of moveHistory) {
    for (let i = 1; i < hands.length; i++) {
      assert(
        hands[i] - hands[i - 1] >= avoidWithin,
        `player ${player} moved too soon`,
      );
    }
  }
});

