import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class FeatureFlagsService {
  private readonly prefix = 'feature-flag:';

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async getAll(): Promise<Record<string, boolean>> {
    const keys = await this.redis.keys(`${this.prefix}*`);
    if (keys.length === 0) return {};
    const values = await this.redis.mget(keys);
    const result: Record<string, boolean> = {};
    keys.forEach((k, i) => {
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
    await this.redis.set(this.prefix + key, value ? '1' : '0');
    return { key, value };
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.prefix + key);
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
