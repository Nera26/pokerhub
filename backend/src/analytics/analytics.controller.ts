import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  AuditLogsQuerySchema,
  ActivityResponseSchema,
  ErrorCategoriesResponseSchema,
} from '@shared/schemas/analytics';
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
    const params = AuditLogsQuerySchema.parse(query);
    return this.analytics.getAuditLogs(params);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get audit summary' })
  @ApiResponse({ status: 200, description: 'Audit summary' })
  async summary() {
    return this.analytics.getAuditSummary();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get player activity' })
  @ApiResponse({ status: 200, description: 'Activity data' })
  async activity() {
    const data = await this.analytics.getActivity();
    return ActivityResponseSchema.parse(data);
  }

  @Get('error-categories')
  @ApiOperation({ summary: 'Get error categories' })
  @ApiResponse({ status: 200, description: 'Error categories' })
  async errorCategories() {
    const data = await this.analytics.getErrorCategories();
    return ErrorCategoriesResponseSchema.parse(data);
  }
}
