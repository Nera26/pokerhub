import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import type { Repository } from 'typeorm';
import { Table } from '../../src/database/entities/table.entity';
import {
  createRedis,
  createTablesRepository,
  createTournamentService,
  createSinglePlayerService,
} from './test-utils';

describe('TableBalancerService', () => {
  it('skips players moved recently using redis', async () => {
    const moved: string[] = [];
    const repo = createTablesRepository([
      ['p1', 'p2'],
      [],
    ]) as Repository<Table>;
    const tournamentService = createTournamentService(moved);
    const { redis, store } = createRedis();
    const key = 'tourney:t1:lastMoved';
    await redis.hset(key, { p1: '1' });
    expect(store.hashes.get(key)?.get('p1')).toBe('1');
    const service = new TableBalancerService(
      repo,
      tournamentService as any,
      redis,
    );
    await service.rebalanceIfNeeded('t1', 5);
    expect(moved).toEqual(['p2']);
    const hash = store.hashes.get(key);
    expect(hash?.get('p1')).toBe('1');
    expect(hash?.get('p2')).toBe('5');
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

    const service = new TableBalancerService(
      repo,
      tournamentService as any,
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
