import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { RedisModule } from '../redis/redis.module';
import { CollusionService } from './collusion.service';
import { CollusionDetectionJob } from './collusion';
import { ReviewController } from './review.controller';
import { CollusionController } from './collusion.controller';
import { AnalyticsController } from './analytics.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollusionAudit } from './collusion-audit.entity';
import { AuditLogTypeClass } from './audit-log-type-class.entity';
import { AuditLogTypeClassDefault } from './audit-log-type-class-default.entity';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    WalletModule,
    AuthModule,
    StorageModule,
    TypeOrmModule.forFeature([
      CollusionAudit,
      AuditLogTypeClass,
      AuditLogTypeClassDefault,
    ]),
  ],
  providers: [
    AnalyticsService,
    EtlService,
    CollusionService,
    CollusionDetectionJob,
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
  ],
})
export class AnalyticsModule {}
