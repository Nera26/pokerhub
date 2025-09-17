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
} from '@shared/wallet.schema';
import {
  AuditLogEntry,
  AuditLogEntrySchema,
  AuditLogsResponse,
  AuditLogsResponseSchema,
  AuditLogsQuerySchema,
  AuditLogTypesResponse,
  AuditLogTypesResponseSchema,
  AlertItem,
  AlertItemSchema,
  RevenueBreakdown,
  RevenueBreakdownSchema,
} from '@shared/types';
import {
  SidebarItem,
  SidebarItemsResponseSchema,
  AdminTab,
  AdminTabResponseSchema,
  AdminEvent,
  AdminEventsResponseSchema,
  AdminTabCreateRequestSchema,
  type CreateAdminTabRequest,
  AdminTabUpdateRequestSchema,
  type UpdateAdminTabRequest,
  AdminTabSchema,
} from '../schemas/admin';
import { SidebarService } from '../services/sidebar.service';
import { KycService } from '../wallet/kyc.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RevenueService } from '../wallet/revenue.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminTabsService } from '../services/admin-tabs.service';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly kyc: KycService,
    private readonly analytics: AnalyticsService,
    private readonly sidebar: SidebarService,
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
    const params = AuditLogsQuerySchema.parse(query);
    const data = await this.analytics.getAuditLogs(params);
    return AuditLogsResponseSchema.parse(data);
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
    const types = await this.analytics.getAuditLogTypes();
    return AuditLogTypesResponseSchema.parse({ types });
  }

  @Get('security-alerts')
  @ApiOperation({ summary: 'Get security alerts' })
  @ApiResponse({ status: 200, description: 'Security alerts' })
  async securityAlerts(): Promise<AlertItem[]> {
    const alerts = await this.analytics.getSecurityAlerts();
    return z.array(AlertItemSchema).parse(alerts);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get admin events' })
  @ApiResponse({ status: 200, description: 'Admin events' })
  async events(): Promise<AdminEvent[]> {
    const ev = await this.analytics.getAdminEvents();
    return AdminEventsResponseSchema.parse(ev);
  }

  @Get('sidebar')
  @ApiOperation({ summary: 'Get admin sidebar items' })
  @ApiResponse({ status: 200, description: 'Sidebar items' })
  async getSidebar(): Promise<SidebarItem[]> {
    const items = await this.sidebar.getItems();
    return SidebarItemsResponseSchema.parse(items);
  }

  @Get('tabs')
  @ApiOperation({ summary: 'Get admin dashboard tabs' })
  @ApiResponse({ status: 200, description: 'Dashboard tabs' })
  async getTabs(): Promise<AdminTab[]> {
    const [items, dbTabs] = await Promise.all([
      this.sidebar.getItems(),
      this.tabs.list(),
    ]);
    const dbIds = new Set(dbTabs.map((t) => t.id));
    const tabs = items.map((s) => ({
      id: s.id,
      title: s.label,
      component: s.component,
      icon: s.icon,
      source: dbIds.has(s.id) ? 'database' : 'config',
    }));
    return AdminTabResponseSchema.parse(tabs);
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
    const r = z.enum(['today', 'week', 'month', 'all']).parse(range ?? 'all');
    const data = await this.revenue.getBreakdown(r);
    return RevenueBreakdownSchema.parse(data);
  }

  @Get('wallet/reconcile/mismatches')
  @ApiOperation({ summary: 'List wallet reconciliation mismatches' })
  @ApiResponse({ status: 200, description: 'Wallet mismatches' })
  async walletReconcileMismatches(): Promise<WalletReconcileMismatchesResponse> {
    const report = await this.wallet.reconcile();
    const mismatches = report.map((row) => ({
      account: row.account,
      balance: row.balance,
      journal: row.journal,
      delta: row.balance - row.journal,
      date: new Date().toISOString(),
    }));
    return WalletReconcileMismatchesResponseSchema.parse({ mismatches });
  }
}
