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
import {
  SidebarItem,
  SidebarItemsResponseSchema,
} from '../schemas/admin';
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

  private readonly sidebar: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
    { id: 'users', label: 'Manage Users', icon: 'users' },
    {
      id: 'balance',
      label: 'Balance & Transactions',
      icon: 'dollar-sign',
    },
    { id: 'tables', label: 'Manage Tables', icon: 'table-cells' },
    { id: 'tournaments', label: 'Tournaments', icon: 'trophy' },
    { id: 'bonus', label: 'Bonus Manager', icon: 'gift' },
    { id: 'broadcast', label: 'Broadcast', icon: 'bullhorn' },
    { id: 'messages', label: 'Messages', icon: 'envelope' },
    { id: 'audit', label: 'Audit Logs', icon: 'clipboard-list' },
    { id: 'analytics', label: 'Analytics', icon: 'chart-bar' },
    {
      id: 'review',
      label: 'Collusion Review',
      icon: 'magnifying-glass',
      path: '/review',
    },
  ];

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

  @Get('sidebar')
  @ApiOperation({ summary: 'Get admin sidebar items' })
  @ApiResponse({ status: 200, description: 'Sidebar items' })
  async getSidebar(): Promise<SidebarItem[]> {
    return SidebarItemsResponseSchema.parse(this.sidebar);
  }
}
