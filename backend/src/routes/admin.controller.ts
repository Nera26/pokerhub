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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Request } from 'express';
import {
  KycDenialResponse,
  KycDenialResponseSchema,
  WalletReconcileMismatchesResponseSchema,
  type WalletReconcileMismatchesResponse,
  WalletReconcileMismatchAcknowledgementSchema,
  type WalletReconcileMismatchAcknowledgement,
} from '@shared/wallet.schema';
import {
  AuditLogEntry,
  AuditLogEntrySchema,
  AuditLogsResponse,
  AuditLogTypesResponse,
  AlertItem,
  AlertItemSchema,
  RevenueBreakdown,
  RevenueBreakdownSchema,
  RevenueTimeFilterSchema,
  LogTypeClasses,
  type RevenueTimeFilter,
} from '@shared/types';
import {
  AdminTab,
  AdminTabResponseSchema,
  AdminEvent,
  AdminEventsResponseSchema,
  AdminTabCreateRequestSchema,
  type CreateAdminTabRequest,
  AdminTabUpdateRequestSchema,
  type UpdateAdminTabRequest,
  AdminTabSchema,
  AdminTabMetaSchema,
  type AdminTabMeta,
} from '../schemas/admin';
import {
  MessageResponse,
  MessageResponseSchema,
} from '../schemas/auth';
import { KycService } from '../wallet/kyc.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RevenueService } from '../wallet/revenue.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminTabsService } from '../services/admin-tabs.service';
import {
  getAuditLogClassMap,
  getAuditLogsResponse,
  getAuditLogTypesResponse,
} from '../analytics/analytics.controller';

const BUILT_IN_ADMIN_TABS: AdminTab[] = [
  {
    id: 'collusion',
    title: 'Collusion Review',
    component: '@/features/collusion',
    icon: 'faUserShield',
    source: 'config',
  },
];

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly kyc: KycService,
    private readonly analytics: AnalyticsService,
    private readonly tabs: AdminTabsService,
    private readonly revenue: RevenueService,
    private readonly wallet: WalletService,
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
  async auditLogs(@Query() query: unknown): Promise<AuditLogsResponse> {
    return getAuditLogsResponse(this.analytics, query);
  }

  @Post('audit-logs/:id/review')
  @ApiOperation({ summary: 'Mark audit log reviewed' })
  @ApiResponse({ status: 200, description: 'Audit log updated' })
  @HttpCode(200)
  async reviewAuditLog(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<AuditLogEntry> {
    const adminId = (req as Request & { userId?: string }).userId ?? 'admin';
    const updated = await this.analytics.markAuditLogReviewed(id, adminId);
    return AuditLogEntrySchema.parse(updated);
  }

  @Get('audit/log-types')
  @ApiOperation({ summary: 'Get audit log types' })
  @ApiResponse({ status: 200, description: 'Audit log types' })
  async auditLogTypes(): Promise<AuditLogTypesResponse> {
    return getAuditLogTypesResponse(this.analytics);
  }

  @Get('log-types')
  @ApiOperation({ summary: 'Get audit log type classes' })
  @ApiResponse({ status: 200, description: 'Audit log type classes' })
  async auditLogTypeClasses(): Promise<LogTypeClasses> {
    return getAuditLogClassMap(this.analytics);
  }

  @Get('security-alerts')
  @ApiOperation({ summary: 'Get security alerts' })
  @ApiResponse({ status: 200, description: 'Security alerts' })
  async securityAlerts(): Promise<AlertItem[]> {
    const alerts = await this.analytics.getSecurityAlerts();
    return z.array(AlertItemSchema).parse(alerts);
  }

  @Post('security-alerts/:id/ack')
  @ApiOperation({ summary: 'Acknowledge security alert' })
  @ApiResponse({ status: 200, description: 'Security alert acknowledged' })
  @HttpCode(200)
  async acknowledgeSecurityAlert(@Param('id') id: string): Promise<AlertItem> {
    const updated = await this.analytics.acknowledgeSecurityAlert(id);
    return AlertItemSchema.parse(updated);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get admin events' })
  @ApiResponse({ status: 200, description: 'Admin events' })
  async events(): Promise<AdminEvent[]> {
    const ev = await this.analytics.getAdminEvents();
    return AdminEventsResponseSchema.parse(ev);
  }

  @Post('events/:id/ack')
  @ApiOperation({ summary: 'Acknowledge admin event' })
  @ApiResponse({ status: 200, description: 'Admin event acknowledged' })
  @ApiResponse({ status: 404, description: 'Admin event not found' })
  @HttpCode(200)
  async acknowledgeAdminEvent(
    @Param('id') id: string,
  ): Promise<MessageResponse> {
    await this.analytics.acknowledgeAdminEvent(id);
    return MessageResponseSchema.parse({ message: 'acknowledged' });
  }

  @Get('tabs')
  @ApiOperation({ summary: 'Get admin dashboard tabs' })
  @ApiResponse({ status: 200, description: 'Dashboard tabs' })
  async getTabs(): Promise<AdminTab[]> {
    const dbTabs = await this.tabs.list();
    const tabs = dbTabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      component: tab.component,
      icon: tab.icon,
      source: 'database' as const,
    }));
    const configTabs = BUILT_IN_ADMIN_TABS.filter(
      (tab) => !tabs.some((existing) => existing.id === tab.id),
    );
    return AdminTabResponseSchema.parse([...configTabs, ...tabs]);
  }

  @Get('tabs/:id')
  @ApiOperation({ summary: 'Get admin tab metadata' })
  @ApiResponse({ status: 200, description: 'Admin tab metadata' })
  async getTabMeta(@Param('id') id: string): Promise<AdminTabMeta> {
    const [dbTabs, dbTab] = await Promise.all([
      this.tabs.list(),
      this.tabs.find(id),
    ]);

    const configTab = BUILT_IN_ADMIN_TABS.find((tab) => tab.id === id);
    if (configTab) {
      return AdminTabMetaSchema.parse({
        id: configTab.id,
        title: configTab.title,
        component: configTab.component,
        enabled: true,
        message: '',
      });
    }

    if (dbTab) {
      return AdminTabMetaSchema.parse({
        id: dbTab.id,
        title: dbTab.title,
        component: dbTab.component,
        enabled: true,
        message: '',
      });
    }

    const configTabFromDb = dbTabs.find((tab) => tab.id === id);
    if (configTabFromDb) {
      return AdminTabMetaSchema.parse({
        id: configTabFromDb.id,
        title: configTabFromDb.title,
        component: configTabFromDb.component,
        enabled: true,
        message: '',
      });
    }

    const title = id
      .split(/[-_]/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');

    return AdminTabMetaSchema.parse({
      id,
      title: title || id,
      component: '',
      enabled: false,
      message: 'This section is coming soon.',
    });
  }

  @Post('tabs')
  @ApiOperation({ summary: 'Create admin dashboard tab' })
  @ApiResponse({ status: 200, description: 'Created admin tab' })
  @HttpCode(200)
  async createTab(@Body() body: CreateAdminTabRequest): Promise<AdminTab> {
    const parsed = AdminTabCreateRequestSchema.parse(body);
    const created = await this.tabs.create(parsed);
    return AdminTabSchema.parse({ ...created, source: 'database' });
  }

  @Put('tabs/:id')
  @ApiOperation({ summary: 'Update admin dashboard tab' })
  @ApiResponse({ status: 200, description: 'Updated admin tab' })
  async updateTab(
    @Param('id') id: string,
    @Body() body: UpdateAdminTabRequest,
  ): Promise<AdminTab> {
    const parsed = AdminTabUpdateRequestSchema.parse(body);
    const updated = await this.tabs.update(id, parsed);
    return AdminTabSchema.parse({ ...updated, source: 'database' });
  }

  @Delete('tabs/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete admin dashboard tab' })
  @ApiResponse({ status: 204, description: 'Admin tab deleted' })
  async deleteTab(@Param('id') id: string): Promise<void> {
    await this.tabs.remove(id);
  }

  @Get('revenue-breakdown')
  @ApiOperation({ summary: 'Get revenue breakdown' })
  @ApiResponse({ status: 200, description: 'Revenue breakdown' })
  async revenueBreakdown(@Query('range') range: string): Promise<RevenueBreakdown> {
    const r: RevenueTimeFilter = RevenueTimeFilterSchema.parse(range ?? 'all');
    const data = await this.revenue.getBreakdown(r);
    return RevenueBreakdownSchema.parse(data);
  }

  @Get('wallet/reconcile/mismatches')
  @ApiOperation({ summary: 'List wallet reconciliation mismatches' })
  @ApiResponse({ status: 200, description: 'Wallet mismatches' })
  async walletReconcileMismatches(): Promise<WalletReconcileMismatchesResponse> {
    const report = await this.wallet.reconcile();
    const filtered = this.wallet.filterAcknowledgedMismatches(report);
    const mismatches = filtered.map((row) => ({
      account: row.account,
      balance: row.balance,
      journal: row.journal,
      delta: row.balance - row.journal,
      date: new Date().toISOString(),
    }));
    return WalletReconcileMismatchesResponseSchema.parse({ mismatches });
  }

  @Post('wallet/reconcile/mismatches/:account/ack')
  @ApiOperation({ summary: 'Acknowledge wallet reconciliation mismatch' })
  @ApiResponse({ status: 200, description: 'Mismatch acknowledged' })
  @HttpCode(200)
  async acknowledgeWalletMismatch(
    @Param('account') account: string,
    @Req() req: Request,
  ): Promise<WalletReconcileMismatchAcknowledgement> {
    const adminId = (req as Request & { userId?: string }).userId ?? 'admin';
    const acknowledgement = await this.wallet.acknowledgeMismatch(
      account,
      adminId,
    );
    return WalletReconcileMismatchAcknowledgementSchema.parse(acknowledgement);
  }
}
