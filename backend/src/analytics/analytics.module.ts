import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import { EtlService } from './etl.service';
import { CollusionDetectionService } from './collusion.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConfigModule, RedisModule],
  providers: [AnalyticsService, EtlService, CollusionDetectionService],
  exports: [AnalyticsService, EtlService, CollusionDetectionService],
})
export class AnalyticsModule {}
