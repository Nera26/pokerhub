import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class AnalyticsService {
  private readonly client: ClickHouseClient | null;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(config: ConfigService) {
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
}
