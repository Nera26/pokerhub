import RedisMock from 'ioredis-mock';
import type { Redis } from 'ioredis';
import { saveRecentlyMoved } from './redis.util';

describe('saveRecentlyMoved', () => {
  it('deletes key when map is empty', async () => {
    const redis = new RedisMock() as unknown as Redis;
    const tournamentId = 't1';
    const key = `tourney:${tournamentId}:lastMoved`;
    await redis.hset(key, { a: '1' });

    await saveRecentlyMoved(redis, tournamentId, new Map());

    expect(await redis.exists(key)).toBe(0);
  });

  it('stores map entries when populated', async () => {
    const redis = new RedisMock() as unknown as Redis;
    const tournamentId = 't2';
    const map = new Map([
      ['p1', 1],
      ['p2', 2],
    ]);

    await saveRecentlyMoved(redis, tournamentId, map);

    expect(await redis.hgetall(`tourney:${tournamentId}:lastMoved`)).toEqual({
      p1: '1',
      p2: '2',
    });
  });
});
