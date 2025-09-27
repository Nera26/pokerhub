import type Redis from 'ioredis';

/**
 * Stores a string value in Redis with a TTL expressed in seconds.
 * Wraps the raw call so callers avoid repeating option objects.
 */
export async function setWithExpiry(
  redis: Redis,
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(key, value, 'EX', ttlSeconds);
}
