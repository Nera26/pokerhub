import type { Repository } from 'typeorm';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { createInMemoryRedis } from '../utils/mock-redis';
import { createTestTable, createTestTournament } from './helpers';

export type TournamentService = {
  balanceTournament(
    tournamentId: string,
    currentHand: number,
    avoidWithin: number,
    recentlyMoved: Map<string, number>,
  ): Promise<void>;
};

export function createTablesRepository(
  data: string[][] | Table[],
): Partial<Repository<Table>> {
  const ensureTableDefaults = (table: Table, index: number): Table => {
    const tournament =
      table.tournament ?? createTestTournament({ id: `tournament${index}` });
    if (!tournament.tables) {
      tournament.tables = [];
    }
    if (!tournament.details) {
      tournament.details = [];
    }

    const base = createTestTable(table.id ?? `table${index}`, tournament);
    const providedSeats = table.seats;
    const providedPlayers = table.players;

    Object.assign(table, base, table);
    table.tournament = tournament;
    if (!tournament.tables.includes(table)) {
      tournament.tables.push(table);
    }

    const seats = providedSeats ?? [];
    if (!providedSeats) {
      table.seats = seats;
    }
    seats.forEach((seat, seatIndex) => {
      seat.id = seat.id ?? `seat${table.id}-${seatIndex}`;
      seat.table = table;
      seat.position = seat.position ?? seatIndex;
      seat.user = seat.user ?? ({ id: `player${seatIndex}` } as any);
      seat.lastMovedHand = seat.lastMovedHand ?? 0;
    });
    table.seats = seats;

    if (providedPlayers) {
      table.players = providedPlayers;
    } else {
      table.players = table.seats.map((seat) => seat.user);
    }
    table.playersCurrent = table.playersCurrent ?? table.seats.length;

    return table;
  };

  const tables: Table[] =
    Array.isArray(data) && typeof data[0]?.[0] === 'string'
      ? (() => {
          const tournament = createTestTournament({ id: 'tournament' });
          return (data as string[][]).map((pids, i) => {
            const table = createTestTable(`table${i}`, tournament);
            table.seats = pids.map((id, seatIndex) => ({
              id: `seat${i}-${seatIndex}`,
              table,
              user: { id } as any,
              position: seatIndex,
              lastMovedHand: 0,
            })) as Seat[];
            table.players = table.seats.map((seat) => seat.user);
            table.playersCurrent = table.seats.length;
            if (!tournament.tables.includes(table)) {
              tournament.tables.push(table);
            }
            return table;
          });
        })()
      : (data as Table[]).map(ensureTableDefaults);
  return {
    find: jest.fn().mockResolvedValue(tables),
  };
}

export { createInMemoryRedis };
export const createRedis = createInMemoryRedis;

export function createTournamentService(moved: string[]): TournamentService {
  return {
    balanceTournament(
      _tournamentId: string,
      currentHand: number,
      avoidWithin: number,
      recentlyMoved: Map<string, number>,
    ): Promise<void> {
      const allPlayers = ['p1', 'p2'];
      const candidate = allPlayers.find((p) => {
        const last = recentlyMoved.get(p);
        return last === undefined || currentHand - last >= avoidWithin;
      });
      if (candidate) {
        moved.push(candidate);
        recentlyMoved.set(candidate, currentHand);
      }
      return Promise.resolve();
    },
  };
}

export function createSinglePlayerService(moved: string[]): TournamentService {
  return {
    balanceTournament(
      _tournamentId: string,
      currentHand: number,
      avoidWithin: number,
      recentlyMoved: Map<string, number>,
    ): Promise<void> {
      const last = recentlyMoved.get('p1');
      if (last === undefined || currentHand - last >= avoidWithin) {
        moved.push('p1');
        recentlyMoved.set('p1', currentHand);
      }
      return Promise.resolve();
    },
  };
}
