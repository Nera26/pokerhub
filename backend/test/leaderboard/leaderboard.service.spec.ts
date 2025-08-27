import { LeaderboardService } from '../../src/leaderboard/leaderboard.service';
import type { Cache } from 'cache-manager';
import { newDb } from 'pg-mem';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/database/entities/user.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Tournament } from '../../src/database/entities/tournament.entity';

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

describe('LeaderboardService', () => {
  let dataSource: DataSource;
  let repo: Repository<User>;
  let cache: MockCache;
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
      entities: [User, Table, Tournament],
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
    service = new LeaderboardService(cache as unknown as Cache, repo);
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
});
