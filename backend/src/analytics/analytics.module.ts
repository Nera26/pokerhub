import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { RedisModule } from '../redis/redis.module';
import { CollusionService } from './collusion.service';
import { CollusionQueryService } from './collusion.queries';
import { ReviewController } from './review.controller';
import { CollusionController } from './collusion.controller';
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
  ],
  exports: [
    AnalyticsService,
    EtlService,
    CollusionService,
    CollusionQueryService,
  ],
  controllers: [ReviewController, CollusionController, AdminController],
})
export class AnalyticsModule {}
