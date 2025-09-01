import { TableBalancerService } from './table-balancer.service';
import type { Repository } from 'typeorm';
import type Redis from 'ioredis';
import { Table } from '../database/entities/table.entity';
import { TournamentService } from './tournament.service';

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

describe('TableBalancerService', () => {
  it('skips players moved recently using redis', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2'],
      [],
    ]) as Repository<Table>;
    const tournamentService = createTournamentService(
      moved,
    ) as TournamentService;
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
    const service = new TableBalancerService(repo, tournamentService, redis);
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
    const tournamentService = createTournamentService(
      moved,
    ) as TournamentService;
    const service = new TableBalancerService(repo, tournamentService);
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
});
