import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  AuditLogsQuerySchema,
  AuditLogsResponseSchema,
  AuditLogTypesResponseSchema,
  ActivityResponseSchema,
  ErrorCategoriesResponseSchema,
  LogTypeClassesSchema,
} from '@shared/schemas/analytics';
import { AdminGuard } from '../auth/admin.guard';

export async function getAuditLogsResponse(
  analytics: AnalyticsService,
  query: unknown,
) {
  const params = AuditLogsQuerySchema.parse(query);
  const data = await analytics.getAuditLogs(params);
  return AuditLogsResponseSchema.parse(data);
}

export async function getAuditLogTypesResponse(
  analytics: AnalyticsService,
) {
  const types = await analytics.getAuditLogTypes();
  return AuditLogTypesResponseSchema.parse({ types });
}

export async function getAuditLogClassMap(analytics: AnalyticsService) {
  const classes = await analytics.getAuditLogTypeClasses();
  return LogTypeClassesSchema.parse(classes);
}

@UseGuards(AdminGuard)
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async logs(@Query() query: unknown) {
    return getAuditLogsResponse(this.analytics, query);
  }

  @Get('log-types')
  @ApiOperation({ summary: 'Get audit log types' })
  @ApiResponse({ status: 200, description: 'Audit log types' })
  async logTypes() {
    return getAuditLogTypesResponse(this.analytics);
  }

  @Get('log-types/classes')
  @ApiOperation({ summary: 'Get audit log type classes' })
  @ApiResponse({ status: 200, description: 'Audit log type classes' })
  async logTypeClasses() {
    return getAuditLogClassMap(this.analytics);
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
