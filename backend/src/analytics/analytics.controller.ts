import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuditLogsQuerySchema } from '../schemas/analytics';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('logs')
  async logs(@Query() query: unknown) {
    const { cursor, limit } = AuditLogsQuerySchema.parse(query);
    return this.analytics.getAuditLogs({ cursor, limit });
  }

  @Get('summary')
  async summary() {
    return this.analytics.getAuditSummary();
  }
}
