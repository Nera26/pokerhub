import { TableBalancerService } from './table-balancer.service';
import type { Repository } from 'typeorm';
import type Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
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

function createTournamentService(moved: string[]): Partial<TournamentService> {
  return {
    balanceTournament(
      _tournamentId: string,
      currentHand: number,
      _avoidWithin: number,
      recentlyMoved: Map<string, number>,
    ): Promise<void> {
      const allPlayers = ['p1', 'p2'];
      const candidate = allPlayers.find((p) => !recentlyMoved.has(p));
      if (candidate) {
        moved.push(candidate);
        recentlyMoved.set(candidate, currentHand);
      }
      return Promise.resolve();
    },
  };
}

function createSinglePlayerService(moved: string[]): Partial<TournamentService> {
  return {
    balanceTournament(
      _tournamentId: string,
      currentHand: number,
      avoidWithin: number,
      recentlyMoved: Map<string, number>,
    ): Promise<void> {
      const last = recentlyMoved.get('p1') ?? -Infinity;
      if (currentHand - last >= avoidWithin) {
        moved.push('p1');
        recentlyMoved.set('p1', currentHand);
      }
      return Promise.resolve();
    },
  };
}

describe('TableBalancerService', () => {
  it('skips players moved recently using redis', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2'],
      [],
    ]) as Repository<Table>;
    const tournamentService = createTournamentService(moved);
    const store = new Map<string, string>([['p1', '1']]);
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
    const service = new TableBalancerService(
      repo,
      tournamentService as any,
      redis,
    );
    await service.rebalanceIfNeeded('t1', 5);
    expect(moved).toEqual(['p2']);
    expect(store.get('p1')).toBe('1');
    expect(store.get('p2')).toBe('5');
  });

  it('skips players moved recently using local state', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2'],
      [],
    ]) as Repository<Table>;
    const tournamentService = createTournamentService(moved);
    const service = new TableBalancerService(
      repo,
      tournamentService as any,
    );
    (
      service as unknown as {
        localRecentlyMoved: Map<string, Map<string, number>>;
      }
    ).localRecentlyMoved.set('t1', new Map([['p1', 1]]));
    await service.rebalanceIfNeeded('t1', 5);
    expect(moved).toEqual(['p2']);
    const localStore = (
      service as unknown as {
        localRecentlyMoved: Map<string, Map<string, number>>;
      }
    ).localRecentlyMoved.get('t1');
    expect(localStore?.get('p1')).toBe(1);
    expect(localStore?.get('p2')).toBe(5);
  });

  it('respects avoidWithin threshold before moving a player again', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2'],
      [],
    ]) as Repository<Table>;
    const tournamentService = createSinglePlayerService(moved);
    const service = new TableBalancerService(
      repo,
      tournamentService as any,
    );

    await service.rebalanceIfNeeded('t1', 0, 2);
    expect(moved).toEqual(['p1']);

    await service.rebalanceIfNeeded('t1', 1, 2);
    expect(moved).toEqual(['p1']);

    await service.rebalanceIfNeeded('t1', 2, 2);
    expect(moved).toEqual(['p1', 'p1']);
  });

  it('waits avoidWithin hands based on TOURNAMENT_AVOID_WITHIN before moving again', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2'],
      [],
    ]) as Repository<Table>;
    const tournamentService = createSinglePlayerService(moved);

    const original = process.env.TOURNAMENT_AVOID_WITHIN;
    process.env.TOURNAMENT_AVOID_WITHIN = '3';
    const config = new ConfigService({ tournament: { avoidWithin: 3 } });

    const service = new TableBalancerService(
      repo,
      tournamentService as any,
      undefined,
      config,
    );

    expect((service as unknown as { defaultAvoidWithin: number }).defaultAvoidWithin).toBe(3);

    try {
      await service.rebalanceIfNeeded('t1', 0);
      await service.rebalanceIfNeeded('t1', 1);
      await service.rebalanceIfNeeded('t1', 2);
      await service.rebalanceIfNeeded('t1', 3);
      await service.rebalanceIfNeeded('t1', 4);
      await service.rebalanceIfNeeded('t1', 5);
      await service.rebalanceIfNeeded('t1', 6);

      expect(moved).toEqual(['p1', 'p1', 'p1']);
    } finally {
      if (original === undefined) {
        delete process.env.TOURNAMENT_AVOID_WITHIN;
      } else {
        process.env.TOURNAMENT_AVOID_WITHIN = original;
      }
    }
  });
});
