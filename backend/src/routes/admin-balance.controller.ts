import { Controller, Post, Param, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminBalanceRequest, AdminBalanceRequestSchema } from '@shared/wallet.schema';
import { WalletService } from '../wallet/wallet.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MessageResponse, MessageResponseSchema } from '../schemas/auth';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/balance')
export class AdminBalanceController {
  constructor(
    private readonly wallet: WalletService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Post(':userId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Adjust user balance' })
  @ApiResponse({ status: 200, description: 'Balance adjusted' })
  async adjust(
    @Param('userId') userId: string,
    @Body() body: AdminBalanceRequest,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    const {
      action,
      amount,
      currency,
      notes,
    } = AdminBalanceRequestSchema.parse(body);
    await this.wallet.adminAdjustBalance(userId, action, amount, currency);
    await this.analytics.addAuditLog({
      type: 'Balance',
      description: `${action} ${amount} ${currency}${notes ? ` - ${notes}` : ''}`,
      user: req.userId ?? 'admin',
      ip: req.ip || null,
    });
    return MessageResponseSchema.parse({ message: 'ok' });
  }
}
