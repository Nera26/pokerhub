import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { KycDenialResponse, KycDenialResponseSchema } from '@shared/wallet.schema';
import {
  AuditLogsResponse,
  AuditLogsResponseSchema,
  AlertItem,
  AlertItemSchema,
} from '../schemas/analytics';
import { KycService } from '../wallet/kyc.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly kyc: KycService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('kyc/:id/denial')
  @ApiOperation({ summary: 'Get KYC denial reason' })
  @ApiResponse({ status: 200, description: 'Denial reason' })
  async getKycDenial(@Param('id') id: string): Promise<KycDenialResponse> {
    const reason = await this.kyc.getDenialReason(id);
    return KycDenialResponseSchema.parse({ accountId: id, reason: reason ?? null });
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  async auditLogs(): Promise<AuditLogsResponse> {
    const data = await this.analytics.getAuditLogs({});
    return AuditLogsResponseSchema.parse(data);
  }

  @Get('security-alerts')
  @ApiOperation({ summary: 'Get security alerts' })
  @ApiResponse({ status: 200, description: 'Security alerts' })
  async securityAlerts(): Promise<AlertItem[]> {
    const alerts = await this.analytics.getSecurityAlerts();
    return z.array(AlertItemSchema).parse(alerts);
  }

}
