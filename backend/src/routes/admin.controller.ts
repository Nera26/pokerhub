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
  SidebarTabsResponseSchema,
  SidebarTab,
} from '../schemas/admin';
import { sharedSidebar } from '@shared/sidebar';
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

  @Get('sidebar')
  @ApiOperation({ summary: 'Get admin sidebar items' })
  @ApiResponse({ status: 200, description: 'Sidebar items' })
  async getSidebar(): Promise<SidebarItem[]> {
    return SidebarItemsResponseSchema.parse(sharedSidebar);
  }

  @Get('tabs')
  @ApiOperation({ summary: 'Get admin dashboard tabs' })
  @ApiResponse({ status: 200, description: 'Dashboard tabs' })
  async getTabs(): Promise<{ tabs: SidebarTab[]; titles: Record<SidebarTab, string> }> {
    const tabs = sharedSidebar.map((s) => s.id) as SidebarTab[];
    const titles = Object.fromEntries(sharedSidebar.map((s) => [s.id, s.label])) as Record<SidebarTab, string>;
    return SidebarTabsResponseSchema.parse({ tabs, titles });
  }
}
