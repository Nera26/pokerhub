import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { EtlService } from '../analytics/etl.service';

@Injectable()
export class LeaderboardService {
  private readonly cacheKey = 'leaderboard:hot';
  private readonly ttl = 30; // seconds

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly etl: EtlService,
  ) {
    setInterval(() => {
      void this.rebuild();
    }, 24 * 60 * 60 * 1000);
  }

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

  async rebuild(): Promise<void> {
    await this.etl.run();
    await this.invalidate();
  }

  private async fetchTopPlayers(): Promise<string[]> {
    const users = await this.userRepo.find({
      order: { username: 'ASC' },
      take: 3,
    });
    return users.map((u) => u.username);
  }
}
