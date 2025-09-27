import type Redis from 'ioredis';

export class MockRedis {
  private store = new Map<string, string>();
  private hashes = new Map<string, Map<string, string>>();
  private sets = new Map<string, Set<string>>();
  private lists = new Map<string, string[]>();
  private sorted = new Map<string, { score: number; member: string }[]>();
  private streams = new Map<string, Array<[string, [string, string]]>>();
  private expirations = new Map<string, number>();
  private seq = 0;

  constructor() {
    this.wrapMutableMethods();
  }

  private wrapMutableMethods() {
    const mutableMethods: Array<keyof this> = [
      'set',
      'del',
      'incr',
      'incrby',
      'incrbyfloat',
      'decr',
      'decrby',
      'expire',
      'hset',
      'sadd',
      'zadd',
      'zremrangebyscore',
      'rpush',
      'lpush',
      'ltrim',
      'xadd',
    ];

    for (const method of mutableMethods) {
      const original = (this as any)[method]?.bind(this);
      if (typeof original === 'function') {
        (this as any)[method] = jest.fn(original);
      }
    }
  }

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, ...args: any[]) {
    let nx = false;
    let ttl: number | undefined;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === 'NX') {
        nx = true;
      } else if (arg === 'EX') {
        ttl = Number(args[++i]);
      } else if (typeof arg === 'number') {
        ttl = arg;
      }
    }
    if (nx && this.store.has(key)) {
      return null;
    }
    this.store.set(key, value);
    if (ttl) {
      this.expirations.set(key, Date.now() + ttl * 1000);
    }
    return 'OK';
  }

  async del(key: string) {
    const existed =
      this.store.delete(key) ||
      this.hashes.delete(key) ||
      this.sets.delete(key) ||
      this.lists.delete(key) ||
      this.sorted.delete(key) ||
      this.streams.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string) {
    const next = (parseInt(this.store.get(key) ?? '0', 10) + 1).toString();
    this.store.set(key, next);
    return parseInt(next, 10);
  }

  async incrby(key: string, amount: number) {
    const next = (
      parseInt(this.store.get(key) ?? '0', 10) + amount
    ).toString();
    this.store.set(key, next);
    return parseInt(next, 10);
  }

  async incrbyfloat(key: string, amount: number) {
    const next = (
      parseFloat(this.store.get(key) ?? '0') + amount
    ).toString();
    this.store.set(key, next);
    return parseFloat(next);
  }

  async decr(key: string) {
    const next = (parseInt(this.store.get(key) ?? '0', 10) - 1).toString();
    this.store.set(key, next);
    return parseInt(next, 10);
  }

  async decrby(key: string, amount: number) {
    return this.incrby(key, -amount);
  }

  async expire(key: string, ttl: number) {
    this.expirations.set(key, Date.now() + ttl * 1000);
    return 1;
  }

  async exists(key: string) {
    return this.store.has(key) ||
      this.hashes.has(key) ||
      this.sets.has(key) ||
      this.lists.has(key) ||
      this.sorted.has(key) ||
      this.streams.has(key)
      ? 1
      : 0;
  }

  async hset(key: string, field: string | Record<string, string>, value?: string) {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    const map = this.hashes.get(key)!;
    if (typeof field === 'string') {
      map.set(field, value ?? '');
      return 1;
    }
    for (const [f, v] of Object.entries(field)) {
      map.set(f, v);
    }
    return Object.keys(field).length;
  }

  async hget(key: string, field: string) {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hgetall(key: string) {
    const map = this.hashes.get(key);
    const obj: Record<string, string> = {};
    map?.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }

  async sadd(key: string, member: string) {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    this.sets.get(key)!.add(member);
    return 1;
  }

  async smembers(key: string) {
    return Array.from(this.sets.get(key) ?? []);
  }

  async scard(key: string) {
    return this.sets.get(key)?.size ?? 0;
  }

  async zadd(key: string, score: number, member: string) {
    if (!this.sorted.has(key)) this.sorted.set(key, []);
    const arr = this.sorted.get(key)!;
    const existingIndex = arr.findIndex((entry) => entry.member === member);
    if (existingIndex !== -1) {
      arr.splice(existingIndex, 1);
    }
    arr.push({ score, member });
    arr.sort((a, b) => a.score - b.score);
    return 1;
  }

  async zrange(key: string, start: number, stop: number) {
    const arr = this.sorted.get(key) ?? [];
    const end = stop === -1 ? arr.length : stop + 1;
    return arr.slice(start, end).map((e) => e.member);
  }

  async zremrangebyscore(key: string, min: number, max: number) {
    const arr = this.sorted.get(key) ?? [];
    const filtered = arr.filter((e) => e.score < min || e.score > max);
    const removed = arr.length - filtered.length;
    this.sorted.set(key, filtered);
    return removed;
    }

  async zcard(key: string) {
    return (this.sorted.get(key) ?? []).length;
  }

  async rpush(key: string, value: string) {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key)!;
    list.push(value);
    return list.length;
  }

  async lpush(key: string, value: string) {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key)!;
    list.unshift(value);
    return list.length;
  }

  async ltrim(key: string, start: number, stop: number) {
    const list = this.lists.get(key) ?? [];
    const end = stop === -1 ? list.length : stop + 1;
    const trimmed = list.slice(start, end);
    this.lists.set(key, trimmed);
    return 'OK';
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.lists.get(key) ?? [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  async keys(pattern: string) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const allKeys = [
      ...this.store.keys(),
      ...this.hashes.keys(),
      ...this.sets.keys(),
      ...this.lists.keys(),
      ...this.sorted.keys(),
      ...this.streams.keys(),
    ];
    return Array.from(new Set(allKeys)).filter((k) => regex.test(k));
  }

  async xadd(stream: string, _id: string, field: string, value: string) {
    const id = `${++this.seq}-0`;
    const entries = this.streams.get(stream) ?? [];
    entries.push([id, [field, value]]);
    this.streams.set(stream, entries);
    return id;
  }

  async xread(...args: any[]) {
    const index = args.indexOf('STREAMS');
    if (index === -1) return null;
    const streams = args.slice(index + 1, index + 1 + (args.length - index - 1) / 2);
    const ids = args.slice(index + 1 + streams.length);
    const result: any[] = [];
    streams.forEach((s: string, i: number) => {
      const entries = this.streams.get(s) ?? [];
      const lastId = ids[i];
      const newEntries = entries.filter(([id]) => id > lastId);
      if (newEntries.length) {
        result.push([s, newEntries]);
      }
    });
    return result.length ? result : null;
  }

  duplicate() {
    return this;
  }

  pipeline() {
    return this.multi();
  }

  multi() {
    const commands: Array<() => Promise<any>> = [];
    const self = this;
    const proxy: any = new Proxy(
      {},
      {
        get(_, prop) {
          if (prop === 'exec') {
            return async () =>
              Promise.all(commands.map((fn) => fn().then((v) => [null, v])));
          }
          return (...args: any[]) => {
            const fn = (self as any)[prop].bind(self, ...args);
            commands.push(fn);
            return proxy;
          };
        },
      },
    );
    return proxy;
  }
}

export type InMemoryRedisStore = Map<string, string> & {
  strings: Map<string, string>;
  hashes: Map<string, Map<string, string>>;
  sets: Map<string, Set<string>>;
  lists: Map<string, string[]>;
  sortedSets: Map<string, { score: number; member: string }[]>;
  streams: Map<string, Array<[string, [string, string]]>>;
  getString(key: string): string | undefined;
  getNumber(key: string): number;
};

export function createInMemoryRedis(
  initial: Record<string, string> = {},
): {
  redis: Redis;
  store: InMemoryRedisStore;
} {
  const redis = new MockRedis();
  for (const [k, v] of Object.entries(initial)) {
    void redis.set(k, v);
  }

  const strings = (redis as any).store as Map<string, string>;
  const store = strings as InMemoryRedisStore;
  store.strings = strings;
  store.hashes = (redis as any).hashes as Map<string, Map<string, string>>;
  store.sets = (redis as any).sets as Map<string, Set<string>>;
  store.lists = (redis as any).lists as Map<string, string[]>;
  store.sortedSets = (redis as any).sorted as Map<
    string,
    { score: number; member: string }[]
  >;
  store.streams = (redis as any).streams as Map<
    string,
    Array<[string, [string, string]]>
  >;
  store.getString = (key: string) => store.get(key);
  store.getNumber = (key: string) => Number(store.get(key) ?? '0');

  return { redis: redis as unknown as Redis, store };
}

export default MockRedis;
