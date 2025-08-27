import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { EventConsumerService } from './event-consumer.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [AnalyticsService, EtlService, EventConsumerService],
  exports: [AnalyticsService, EtlService, EventConsumerService],
})
export class AnalyticsModule {}
