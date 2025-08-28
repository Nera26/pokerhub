import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { newDb } from 'pg-mem';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/database/entities/user.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Tournament } from '../../src/database/entities/tournament.entity';
import { Seat } from '../../src/database/entities/seat.entity';

class MockCache {
  store = new Map<string, any>();
  ttl = new Map<string, number>();
  get<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.store.get(key) as T | undefined);
  }
  set<T>(key: string, value: T, options?: { ttl: number }): Promise<void> {
    this.store.set(key, value);
    if (options?.ttl) {
      this.ttl.set(key, options.ttl);
    }
    return Promise.resolve();
  }
  del(key: string): Promise<void> {
    this.store.delete(key);
    this.ttl.delete(key);
    return Promise.resolve();
  }
}

class MockAnalytics {
  events: any[] = [];
  rangeStream(_stream: string, since: number): Promise<any[]> {
    return Promise.resolve(this.events.filter((e) => e.ts >= since));
  }
}

describe('LeaderboardService', () => {
  let dataSource: DataSource;
  let repo: Repository<User>;
  let cache: MockCache;
  let analytics: MockAnalytics;
  let service: LeaderboardService;

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => '00000000-0000-0000-0000-000000000000',
    });
    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [User, Table, Tournament, Seat],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    repo = dataSource.getRepository(User);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await repo.createQueryBuilder().delete().from(User).where('1=1').execute();
    await repo.save([
      { id: '11111111-1111-1111-1111-111111111111', username: 'alice' },
      { id: '22222222-2222-2222-2222-222222222222', username: 'bob' },
      { id: '33333333-3333-3333-3333-333333333333', username: 'carol' },
      { id: '44444444-4444-4444-4444-444444444444', username: 'dave' },
    ]);
    cache = new MockCache();
    analytics = new MockAnalytics();
    service = new LeaderboardService(
      cache as unknown as Cache,
      repo,
      analytics as unknown as any,
    );
  });

  it('uses cache around DB query', async () => {
    const spy = jest.spyOn(repo, 'find');
    const first = await service.getTopPlayers();
    expect(first).toEqual(['alice', 'bob', 'carol']);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(cache.ttl.get('leaderboard:hot')).toBe(30);

    const second = await service.getTopPlayers();
    expect(second).toEqual(first);
    expect(spy).toHaveBeenCalledTimes(1);

    await service.invalidate();
    await service.getTopPlayers();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('rebuild filters by session minimum and decay', async () => {
    analytics.events = [
      {
        playerId: 'alice',
        sessionId: 's1',
        points: 10,
        ts: Date.now(),
      },
      {
        playerId: 'bob',
        sessionId: 's2',
        points: 20,
        ts: Date.now() - 40 * 24 * 60 * 60 * 1000, // too old
      },
    ];
    await service.rebuild({ days: 30, minSessions: 1, decay: 0.5 });
    const top = await service.getTopPlayers();
    expect(top).toEqual(['alice']);
  });

  it('applies rating decay based on event age', async () => {
    const now = Date.now();
    analytics.events = [
      { playerId: 'alice', sessionId: 'a1', points: 10, ts: now },
      {
        playerId: 'bob',
        sessionId: 'b1',
        points: 10,
        ts: now - 10 * 24 * 60 * 60 * 1000,
      },
    ];
    await service.rebuild({ days: 30, minSessions: 1, decay: 0.9 });
    const top = await service.getTopPlayers();
    expect(top[0]).toBe('alice');
  });

  it('supports player specific session minimums and decay', async () => {
    const now = Date.now();
    analytics.events = [
      { playerId: 'alice', sessionId: 'a1', points: 10, ts: now },
      { playerId: 'alice', sessionId: 'a2', points: 10, ts: now },
      {
        playerId: 'bob',
        sessionId: 'b1',
        points: 10,
        ts: now - 5 * 24 * 60 * 60 * 1000,
      },
    ];
    const minSessionsFn = jest.fn((id: string) => (id === 'alice' ? 3 : 1));
    const decayFn = jest.fn((id: string) => (id === 'alice' ? 1 : 0.5));
    await service.rebuild({
      days: 30,
      minSessions: minSessionsFn,
      decay: decayFn,
    });
    const top = await service.getTopPlayers();
    expect(top).toEqual(['bob']);
    expect(minSessionsFn).toHaveBeenCalledTimes(2);
    expect(decayFn).toHaveBeenCalledTimes(2);
  });

  it('rebuild is deterministic regardless of event order', async () => {
    const now = Date.now();
    const events = [
      { playerId: 'alice', sessionId: 'a', points: 5, ts: now },
      { playerId: 'bob', sessionId: 'b', points: 5, ts: now },
      { playerId: 'carol', sessionId: 'c', points: 5, ts: now },
    ];
    analytics.events = events;
    await service.rebuild({ days: 30, minSessions: 1, decay: 1 });
    const first = await service.getTopPlayers();
    expect(first).toEqual(['alice', 'bob', 'carol']);

    analytics.events = [...events].reverse();
    await service.rebuild({ days: 30, minSessions: 1, decay: 1 });
    const second = await service.getTopPlayers();
    expect(second).toEqual(first);
  });
});
