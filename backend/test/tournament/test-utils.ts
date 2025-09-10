import type { Repository } from 'typeorm';
import { Table } from '../database/entities/table.entity';
import { createInMemoryRedis } from './redis-mock';

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
  const tables: Table[] = Array.isArray(data) && typeof data[0]?.[0] === 'string'
    ? (data as string[][]).map((pids, i) => ({
        id: `table${i}`,
        seats: pids.map((id) => ({ user: { id } })),
      }))
    : (data as Table[]);
  return {
    find: jest.fn().mockResolvedValue(tables),
  };
}

export { createInMemoryRedis };

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
