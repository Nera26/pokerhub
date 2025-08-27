import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class LeaderboardService {
  private readonly cacheKey = 'leaderboard:hot';
  private readonly ttl = 30; // seconds

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async getTopPlayers(): Promise<string[]> {
    const cached = await this.cache.get<string[]>(this.cacheKey);
    if (cached) {
      return cached;
    }

    const top = await this.fetchTopPlayers();
    await this.cache.set(this.cacheKey, top, { ttl: this.ttl });
    return top;
  }

  async invalidate(): Promise<void> {
    await this.cache.del(this.cacheKey);
  }

  private fetchTopPlayers(): Promise<string[]> {
    // TODO: replace with real DB query
    return Promise.resolve(['alice', 'bob', 'carol']);
  }
}
