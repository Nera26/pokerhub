import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AuditLogsQuerySchema } from '@shared/schemas/analytics';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async logs(@Query() query: unknown) {
    const { cursor, limit } = AuditLogsQuerySchema.parse(query);
    return this.analytics.getAuditLogs({ cursor, limit });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get audit summary' })
  @ApiResponse({ status: 200, description: 'Audit summary' })
  async summary() {
    return this.analytics.getAuditSummary();
  }
}
