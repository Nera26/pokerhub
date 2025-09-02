import { TableBalancerService } from './table-balancer.service';
import type { Repository } from 'typeorm';
import type Redis from 'ioredis';
import { Table } from '../database/entities/table.entity';

type TournamentService = {
  balanceTournament(
    tournamentId: string,
    currentHand: number,
    avoidWithin: number,
    recentlyMoved: Map<string, number>,
  ): Promise<void>;
};

function createTablesRepository(
  players: string[][],
): Partial<Repository<Table>> {
  return {
    find: jest.fn().mockResolvedValue(
      players.map((pids, i) => ({
        id: `table${i}`,
        seats: pids.map((id) => ({ user: { id } })),
      })),
    ),
  };
}

function createCyclingService(moved: string[]): Partial<TournamentService> {
  const allPlayers = ['p1', 'p2', 'p3'];
  return {
    balanceTournament(
      _tournamentId: string,
      currentHand: number,
      _avoidWithin: number,
      recentlyMoved: Map<string, number>,
    ): Promise<void> {
      const candidate = allPlayers.find((p) => !recentlyMoved.has(p));
      if (candidate) {
        moved.push(candidate);
        recentlyMoved.set(candidate, currentHand);
      }
      return Promise.resolve();
    },
  };
}

function createRedis(store: Map<string, string>): Redis {
  return {
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
}

describe('TableBalancerService integration', () => {
  const original = process.env.TOURNAMENT_AVOID_WITHIN;
  beforeAll(() => {
    process.env.TOURNAMENT_AVOID_WITHIN = '5';
  });
  afterAll(() => {
    if (original === undefined) {
      delete process.env.TOURNAMENT_AVOID_WITHIN;
    } else {
      process.env.TOURNAMENT_AVOID_WITHIN = original;
    }
  });

  it('skips players moved within last N hands across cycles using redis', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2', 'p3'],
      [],
      [],
    ]) as Repository<Table>;
    const tournamentService = createCyclingService(moved);
    const store = new Map<string, string>();
    const redis = createRedis(store);
    const service = new TableBalancerService(
      repo,
      tournamentService as any,
      redis,
    );

    await service.rebalanceIfNeeded('t1', 0);
    await service.rebalanceIfNeeded('t1', 1);
    await service.rebalanceIfNeeded('t1', 2);

    expect(moved).toEqual(['p1', 'p2', 'p3']);
    expect(store.get('p1')).toBe('0');
    expect(store.get('p2')).toBe('1');
    expect(store.get('p3')).toBe('2');
  });

  it('skips players moved within last N hands across cycles using memory', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2', 'p3'],
      [],
      [],
    ]) as Repository<Table>;
    const tournamentService = createCyclingService(moved);
    const service = new TableBalancerService(
      repo,
      tournamentService as any,
    );

    await service.rebalanceIfNeeded('t1', 0);
    await service.rebalanceIfNeeded('t1', 1);
    await service.rebalanceIfNeeded('t1', 2);

    expect(moved).toEqual(['p1', 'p2', 'p3']);
    const localStore = (
      service as unknown as {
        localRecentlyMoved: Map<string, Map<string, number>>;
      }
    ).localRecentlyMoved.get('t1');
    expect(localStore?.get('p1')).toBe(0);
    expect(localStore?.get('p2')).toBe(1);
    expect(localStore?.get('p3')).toBe(2);
  });
});
