import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { RedisModule } from '../redis/redis.module';
import { EventConsumer } from './event-consumer';
import { CollusionService } from './collusion.service';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [AnalyticsService, EtlService, EventConsumer, CollusionService],
  exports: [AnalyticsService, EtlService, EventConsumer, CollusionService],
})
export class AnalyticsModule {}
