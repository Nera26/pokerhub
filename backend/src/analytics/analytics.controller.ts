import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  AuditLogsQuerySchema,
  AuditLogsResponseSchema,
  AuditLogTypesResponseSchema,
  ActivityResponseSchema,
  ErrorCategoriesResponseSchema,
  LogTypeClassesSchema,
  LogTypeClassSchema,
  LogTypeClassOverrideSchema,
  LogTypeClassOverrideListSchema,
  LogTypeClassParamsSchema,
  LogTypeClassDefaultSchema,
  LogTypeClassDefaultListSchema,
  CreateLogTypeClassOverrideSchema,
  UpdateLogTypeClassOverrideSchema,
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

export async function listAuditLogClassOverrides(analytics: AnalyticsService) {
  const overrides = await analytics.listLogTypeClassOverrides();
  return LogTypeClassOverrideListSchema.parse(overrides);
}

export async function listAuditLogClassDefaults(analytics: AnalyticsService) {
  const defaults = await analytics.listLogTypeClassDefaults();
  return LogTypeClassDefaultListSchema.parse(defaults);
}

export async function createAuditLogClassOverride(
  analytics: AnalyticsService,
  body: unknown,
) {
  const payload = CreateLogTypeClassOverrideSchema.parse(body);
  const override = await analytics.upsertLogTypeClass(
    payload.type,
    payload.className,
  );
  return LogTypeClassOverrideSchema.parse(override);
}

export async function updateAuditLogClassOverride(
  analytics: AnalyticsService,
  params: unknown,
  body: unknown,
) {
  const { type } = LogTypeClassParamsSchema.parse(params);
  const payload = UpdateLogTypeClassOverrideSchema.parse(body);
  const override = await analytics.upsertLogTypeClass(type, payload.className);
  return LogTypeClassOverrideSchema.parse(override);
}

export async function updateAuditLogClassDefault(
  analytics: AnalyticsService,
  body: unknown,
) {
  const payload = LogTypeClassSchema.parse(body);
  const updated = await analytics.upsertLogTypeClassDefault(
    payload.type,
    payload.className,
  );
  return LogTypeClassDefaultSchema.parse(updated);
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

  @Get('log-types/classes/overrides')
  @ApiOperation({ summary: 'List stored audit log type class overrides' })
  @ApiResponse({ status: 200, description: 'Stored audit log type class overrides' })
  async logTypeClassOverrides() {
    return listAuditLogClassOverrides(this.analytics);
  }

  @Get('log-types/classes/defaults')
  @ApiOperation({ summary: 'List default audit log type classes' })
  @ApiResponse({ status: 200, description: 'Default audit log type classes' })
  async logTypeClassDefaults() {
    return listAuditLogClassDefaults(this.analytics);
  }

  @Post('log-types/classes')
  @ApiOperation({ summary: 'Create an audit log type class override' })
  @ApiResponse({ status: 201, description: 'Created audit log type class override' })
  async createLogTypeClass(@Body() body: unknown) {
    return createAuditLogClassOverride(this.analytics, body);
  }

  @Put('log-types/classes/defaults')
  @ApiOperation({ summary: 'Update a default audit log type class' })
  @ApiResponse({ status: 200, description: 'Updated default audit log type class' })
  async updateLogTypeClassDefault(@Body() body: unknown) {
    return updateAuditLogClassDefault(this.analytics, body);
  }

  @Put('log-types/classes/:type')
  @ApiOperation({ summary: 'Update an audit log type class override' })
  @ApiResponse({ status: 200, description: 'Updated audit log type class override' })
  async updateLogTypeClass(@Param() params: unknown, @Body() body: unknown) {
    return updateAuditLogClassOverride(this.analytics, params, body);
  }

  @Delete('log-types/classes/:type')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an audit log type class override' })
  @ApiResponse({ status: 204, description: 'Override removed' })
  async deleteLogTypeClass(@Param() params: unknown) {
    const { type } = LogTypeClassParamsSchema.parse(params);
    await this.analytics.removeLogTypeClass(type);
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
