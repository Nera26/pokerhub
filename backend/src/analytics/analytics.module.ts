import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { RedisModule } from '../redis/redis.module';
import { CollusionService } from './collusion.service';
import { CollusionQueryService } from './collusion.queries';
import { ReviewController } from './review.controller';
import { FlaggedSessionJob } from './flagged-session.job';
import { AdminController } from '../routes/admin.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ConfigModule, RedisModule, WalletModule, AuthModule, StorageModule],
  providers: [
    AnalyticsService,
    EtlService,
    CollusionService,
    CollusionQueryService,
    FlaggedSessionJob,
  ],
  exports: [
    AnalyticsService,
    EtlService,
    CollusionService,
    CollusionQueryService,
    FlaggedSessionJob,
  ],
  controllers: [ReviewController, AdminController],
})
export class AnalyticsModule {}
