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
  const args: (string | number)[] = [];
  if (options?.ex !== undefined) {
    args.push('EX', options.ex);
  }
  if (options?.nx) {
    args.push('NX');
  }
  return client.set(key, value, ...args);
}
