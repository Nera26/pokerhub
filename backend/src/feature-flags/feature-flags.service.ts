import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class FeatureFlagsService {
  private readonly prefix = 'feature-flag:';
  private readonly keySet = 'feature-flag:keys';

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async getAll(): Promise<Record<string, boolean>> {
    const keys = new Set<string>();
    let cursor = '0';

    // First try scanning the dedicated key set for efficiency
    do {
      const [next, batch] = await this.redis.sscan(
        this.keySet,
        cursor,
        'COUNT',
        100,
      );
      cursor = next;
      batch.forEach((k) => keys.add(k));
    } while (cursor !== '0');

    // Fallback to scanning the whole keyspace for legacy keys
    if (keys.size === 0) {
      cursor = '0';
      do {
        const [next, batch] = await this.redis.scan(
          cursor,
          'MATCH',
          `${this.prefix}*`,
          'COUNT',
          100,
        );
        cursor = next;
        batch.forEach((k) => keys.add(k));
      } while (cursor !== '0');
    }

    if (keys.size === 0) return {};

    const fullKeys = Array.from(keys);
    const values = await this.redis.mget(fullKeys);
    const result: Record<string, boolean> = {};
    fullKeys.forEach((k, i) => {
      const short = k.slice(this.prefix.length);
      result[short] = values[i] === '1' || values[i] === 'true';
    });
    return result;
  }

  async get(key: string): Promise<boolean | undefined> {
    const val = await this.redis.get(this.prefix + key);
    if (val === null) return undefined;
    return val === '1' || val === 'true';
  }

  async set(key: string, value: boolean): Promise<{ key: string; value: boolean }> {
    const fullKey = this.prefix + key;
    await this.redis
      .multi()
      .set(fullKey, value ? '1' : '0')
      .sadd(this.keySet, fullKey)
      .exec();
    return { key, value };
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await this.redis
      .multi()
      .del(fullKey)
      .srem(this.keySet, fullKey)
      .exec();
  }

  private roomKey(tableId: string, flag: string): string {
    return `room:${tableId}:${flag}`;
  }

  private tourneyKey(tourneyId: string, flag: string): string {
    return `tourney:${tourneyId}:${flag}`;
  }

  getRoom(tableId: string, flag: string) {
    return this.get(this.roomKey(tableId, flag));
  }

  setRoom(tableId: string, flag: string, value: boolean) {
    return this.set(this.roomKey(tableId, flag), value);
  }

  deleteRoom(tableId: string, flag: string) {
    return this.delete(this.roomKey(tableId, flag));
  }

  getTourney(tourneyId: string, flag: string) {
    return this.get(this.tourneyKey(tourneyId, flag));
  }

  setTourney(tourneyId: string, flag: string, value: boolean) {
    return this.set(this.tourneyKey(tourneyId, flag), value);
  }

  deleteTourney(tourneyId: string, flag: string) {
    return this.delete(this.tourneyKey(tourneyId, flag));
  }

  async canDeal(tableId: string): Promise<boolean> {
    const [global, room] = await Promise.all([
      this.get('dealing'),
      this.getRoom(tableId, 'dealing'),
    ]);
    return global !== false && room !== false;
  }
}
