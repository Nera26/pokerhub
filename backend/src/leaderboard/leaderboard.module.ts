import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { LeaderboardService } from './leaderboard.service';
import { startLeaderboardRebuildWorker } from './rebuild.worker';
import { LeaderboardController } from './leaderboard.controller';
import { AdminLeaderboardConfigController } from './admin-leaderboard-config.controller';
import { User } from '../database/entities/user.entity';
import { Leaderboard } from '../database/entities/leaderboard.entity';
import { LeaderboardConfig } from '../database/entities/leaderboard-config.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LeaderboardConfigService } from './leaderboard-config.service';

@Injectable()
class RebuildWorker implements OnModuleInit {
  constructor(private readonly leaderboard: LeaderboardService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    await startLeaderboardRebuildWorker(this.leaderboard);
  }
}

@Module({
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([User, Leaderboard, LeaderboardConfig]),
    AnalyticsModule,
  ],
  providers: [LeaderboardService, LeaderboardConfigService, RebuildWorker],
  controllers: [LeaderboardController, AdminLeaderboardConfigController],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
