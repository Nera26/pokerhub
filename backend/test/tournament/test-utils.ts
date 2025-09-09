import type { Repository } from 'typeorm';
import type Redis from 'ioredis';
import { Table } from '../database/entities/table.entity';

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

export function createRedis(initial: Record<string, string> = {}): {
  redis: Redis;
  store: Map<string, string>;
} {
  const store = new Map<string, string>(Object.entries(initial));
  const redis = {
    hgetall: (key: string) => {
      void key;
      return Promise.resolve(Object.fromEntries(store));
    },
    hset: (key: string, data: Record<string, string>) => {
      void key;
      for (const [k, v] of Object.entries(data)) store.set(k, v);
      return Promise.resolve(0);
    },
    del: (key: string) => {
      void key;
      store.clear();
      return Promise.resolve(1);
    },
  } as unknown as Redis;
  return { redis, store };
}

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
