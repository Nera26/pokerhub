import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);

  constructor(private readonly analytics: AnalyticsService) {}

  run() {
    // Placeholder for ETL logic
    this.logger.log('Running ETL pipeline');
  }
}
