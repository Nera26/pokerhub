import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { RedisModule } from '../redis/redis.module';
import { CollusionService } from './collusion.service';
import { ReviewController } from './review.controller';
import { FlaggedSessionJob } from './flagged-session.job';
import { AdminController } from '../routes/admin.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, RedisModule, WalletModule, AuthModule],
  providers: [
    AnalyticsService,
    EtlService,
    CollusionService,
    FlaggedSessionJob,
  ],
  exports: [
    AnalyticsService,
    EtlService,
    CollusionService,
    FlaggedSessionJob,
  ],
  controllers: [ReviewController, AdminController],
})
export class AnalyticsModule {}
