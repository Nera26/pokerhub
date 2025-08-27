import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsService {
  private readonly client: ClickHouseClient | null;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    const url = config.get<string>('analytics.clickhouseUrl');
    this.client = url ? createClient({ url }) : null;
  }

  async ingest(table: string, data: Record<string, any>) {
    if (!this.client) {
      this.logger.warn('No ClickHouse client configured');
      return;
    }
    await this.client.insert({
      table,
      values: [data],
      format: 'JSONEachRow',
    });
  }

  async recordGameEvent(event: Record<string, any>) {
    await this.redis.xadd('analytics:game', '*', 'event', JSON.stringify(event));
  }

  async recordTournamentEvent(event: Record<string, any>) {
    await this.redis.xadd(
      'analytics:tournament',
      '*',
      'event',
      JSON.stringify(event),
    );
  }

  async query(sql: string) {
    if (!this.client) {
      this.logger.warn('No ClickHouse client configured');
      return;
    }
    await this.client.command({ query: sql });
  }
}
