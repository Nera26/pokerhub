import type Redis from 'ioredis';

export function createInMemoryRedis(initial: Record<string, string> = {}): {
  redis: Redis;
  store: Map<string, string>;
} {
  const store = new Map<string, string>(Object.entries(initial));
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
  return { redis, store };
}
