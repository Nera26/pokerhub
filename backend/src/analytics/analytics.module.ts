import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { RedisModule } from '../redis/redis.module';
import { CollusionService } from './collusion.service';
import { ReviewController } from './review.controller';
import { CollusionController } from './collusion.controller';
import { AnalyticsController } from './analytics.controller';
import { AdminController } from '../routes/admin.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollusionAudit } from './collusion-audit.entity';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    WalletModule,
    AuthModule,
    StorageModule,
    TypeOrmModule.forFeature([CollusionAudit]),
  ],
  providers: [
    AnalyticsService,
    EtlService,
    CollusionService,
  ],
  exports: [
    AnalyticsService,
    EtlService,
    CollusionService,
  ],
  controllers: [
    ReviewController,
    CollusionController,
    AnalyticsController,
    AdminController,
  ],
})
export class AnalyticsModule {}
