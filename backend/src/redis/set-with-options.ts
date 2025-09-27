import type Redis from 'ioredis';

export interface RedisSetOptions {
  ex?: number;
  nx?: boolean;
}

export function setWithOptions(
  client: Redis,
  key: string,
  value: string,
  options?: RedisSetOptions,
) {
  if (!options) {
    return client.set(key, value);
  }

  const { ex, nx } = options;

  if (ex !== undefined && nx) {
    return client.set(key, value, 'EX', ex, 'NX');
  }

  if (ex !== undefined) {
    return client.set(key, value, 'EX', ex);
  }

  if (nx) {
    return client.set(key, value, 'NX');
  }

  return client.set(key, value);
}
