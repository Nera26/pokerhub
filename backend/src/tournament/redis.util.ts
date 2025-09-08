import type { Redis } from 'ioredis';

export async function saveRecentlyMoved(
  redis: Redis | undefined,
  tournamentId: string,
  recentlyMoved: Map<string, number>,
) {
  if (!redis) return;
  const key = `tourney:${tournamentId}:lastMoved`;
  if (recentlyMoved.size === 0) {
    await redis.del(key);
  } else {
    await redis.hset(
      key,
      Object.fromEntries(
        Array.from(recentlyMoved.entries()).map(([k, v]) => [k, v.toString()]),
      ),
    );
  }
}
