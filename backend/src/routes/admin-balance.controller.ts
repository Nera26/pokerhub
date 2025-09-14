import { Post, Param, Body, Req, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminController } from './admin-base.controller';
import {
  AdminBalanceRequest,
  AdminBalanceRequestSchema,
} from '@shared/wallet.schema';
import { WalletService } from '../wallet/wallet.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MessageResponse, MessageResponseSchema } from '../schemas/auth';

@AdminController('balance')
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
    const { action, amount, currency, notes } =
      AdminBalanceRequestSchema.parse(body);
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
