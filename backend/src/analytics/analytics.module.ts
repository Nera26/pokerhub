import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { RedisModule } from '../redis/redis.module';
import { EventConsumer } from './event-consumer';
import { CollusionService } from './collusion.service';
import { ReviewController } from './review.controller';
import { FlaggedSessionJob } from './flagged-session.job';
import { AdminController } from '../routes/admin.controller';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [
    AnalyticsService,
    EtlService,
    EventConsumer,
    CollusionService,
    FlaggedSessionJob,
  ],
  exports: [
    AnalyticsService,
    EtlService,
    EventConsumer,
    CollusionService,
    FlaggedSessionJob,
  ],
  controllers: [ReviewController, AdminController],
})
export class AnalyticsModule {}
